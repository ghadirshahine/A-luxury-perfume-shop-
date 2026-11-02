'use server'

import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import {writeClient} from '@/sanity/lib/writeClient'
import {CHECKOUT_CUSTOMER_QUERY, CHECKOUT_PRODUCT_QUERY, CHECKOUT_PROMOTION_QUERY} from '@/sanity/lib/queries'

/**
 * Inventory-aware checkout.
 *
 * The client only ever sends identifiers + quantities. Prices, stock and even
 * the existence of a product are re-read from Sanity on the server, so nothing
 * a shopper can tamper with (localStorage cart, devtools) influences what is
 * charged or shipped. An order is created and stock decremented in a single
 * transaction whose patches use optimistic concurrency (`ifRevisionID`), so a
 * concurrent change aborts the whole commit instead of overselling. Quantities
 * are aggregated per product (stock is shared across sizes) before validation.
 * Shipping and packaging fees are recomputed on the server from the same
 * fulfilment rules the cart shows, so a client cannot fake a lower total.
 */

const lineSchema = z.object({
  productId: z.string().min(1),
  ml: z.number().int().positive().optional(),
  qty: z.number().int().positive().max(99),
})

const checkoutSchema = z.object({
  items: z.array(lineSchema).min(1).max(50),
  customer: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(32).refine((value) => value.replace(/\D/g, '').length >= 6),
    email: z.string().email().optional().or(z.literal('')),
    city: z.string().max(80).optional(),
    address: z.string().max(400).optional(),
  }),
  paymentMethod: z.enum(['knet', 'card', 'applepay', 'paypal', 'cod']),
  couponCode: z.string().max(40).optional(),
})

export type CheckoutInput = z.input<typeof checkoutSchema>

export type CheckoutResult =
  | {ok: true; orderNumber: string; total: number; discount: number; currency: string}
  | {ok: false; error: string}

type SanityProduct = {
  _id: string
  _rev: string
  slug?: string
  name?: string
  price: number
  oldPrice?: number | null
  currency?: string
  stock?: number
  sizes?: {ml: number; price: number; label?: string}[]
}

type SanityPromotion = {
  discountType?: 'percent' | 'fixed'
  discountValue?: number
  minimumSubtotal?: number
  startsAt?: string
  endsAt?: string
}

type SanityCustomer = {_id: string; _rev: string}

function round3(n: number) {
  return Math.round(n * 1000) / 1000
}

// Storefront fulfilment rules live on the server so a client cannot fake its own
// shipping/packaging. Kept in sync with the cart page's estimate (free ≥ 20).
const FREE_SHIPPING_THRESHOLD = 20
const STANDARD_SHIPPING_FEE = 1

export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    return {ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid checkout payload'}
  }
  const {items, customer, paymentMethod, couponCode} = parsed.data

  // 1. Re-read authoritative product data from Sanity (never trust the client).
  const ids = [...new Set(items.map((i) => i.productId))]
  const products = await writeClient.fetch<SanityProduct[]>(CHECKOUT_PRODUCT_QUERY, {ids})
  const byId = new Map<string, SanityProduct>(products.map((p: SanityProduct) => [p._id, p]))

  // 2. Resolve server-side pricing and AGGREGATE by product, then validate the
  //    total quantity per product against live stock. Validation MUST be on the
  //    aggregate: a basket can hold several size-lines of the same product and
  //    stock is shared across all sizes of that product.
  const lineMap = new Map<
    string,
    {productId: string; nameSnapshot: string; ml?: number; qty: number; unitPrice: number; lineTotal: number}
  >()
  const perProduct = new Map<string, {product: SanityProduct; total: number}>()

  let subtotal = 0
  let currency = 'KWD'

  for (const item of items) {
    const product = byId.get(item.productId)
    if (!product) return {ok: false, error: 'A product in your basket is no longer available'}

    // Size pricing: use the matching size price when the product defines sizes.
    const size = item.ml != null ? product.sizes?.find((s) => s.ml === item.ml) : undefined
    const unitPrice = size?.price ?? product.price ?? 0
    currency = product.currency ?? currency
    subtotal = round3(subtotal + round3(unitPrice * item.qty))

    // Merge identical (product,size) lines so each order item _key stays unique.
    const lkey = `${item.productId}:${item.ml ?? 'd'}`
    const existing = lineMap.get(lkey)
    if (existing) {
      existing.qty += item.qty
      existing.lineTotal = round3(existing.unitPrice * existing.qty)
    } else {
      lineMap.set(lkey, {
        productId: item.productId,
        nameSnapshot: product.name ?? 'Item',
        ml: item.ml,
        qty: item.qty,
        unitPrice,
        lineTotal: round3(unitPrice * item.qty),
      })
    }

    const agg = perProduct.get(item.productId) ?? {product, total: 0}
    agg.total += item.qty
    perProduct.set(item.productId, agg)
  }

  // Validate the aggregate quantity per product against authoritative stock.
  for (const agg of perProduct.values()) {
    const stock = agg.product.stock ?? 0
    if (stock < agg.total) {
      return {
        ok: false,
        error: `Only ${stock} left of “${agg.product.name ?? 'that item'}” in your basket`,
      }
    }
  }

  let discount = 0
  const normalizedCoupon = couponCode?.trim().toUpperCase()
  if (normalizedCoupon) {
    const promotion = await writeClient.fetch<SanityPromotion | null>(CHECKOUT_PROMOTION_QUERY, {code: normalizedCoupon})
    const now = Date.now()
    if (
      !promotion ||
      (promotion.startsAt && Date.parse(promotion.startsAt) > now) ||
      (promotion.endsAt && Date.parse(promotion.endsAt) < now) ||
      subtotal < (promotion.minimumSubtotal ?? 0)
    ) {
      return {ok: false, error: 'This coupon is invalid, inactive, or does not meet its minimum spend'}
    }
    const value = promotion.discountValue ?? 0
    if (promotion.discountType === 'percent' && value > 0 && value <= 100) {
      discount = round3(subtotal * value / 100)
    } else if (promotion.discountType === 'fixed' && value > 0) {
      discount = Math.min(subtotal, value)
    } else {
      return {ok: false, error: 'This coupon is not configured correctly'}
    }
  }

  // 3. Decide shipping + packaging here, from the server-side subtotal — never
  //    from the client — mirroring the cart page's estimate.
  const discountedSubtotal = round3(subtotal - discount)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
  const packaging = 0
  const total = round3(discountedSubtotal + shipping + packaging)
  const orderNumber = `AUM-${Date.now().toString(36).toUpperCase()}`
  const placedAt = new Date().toISOString()
  const normalizedPhone = customer.phone.replace(/\D/g, '')
  const existingCustomer = await writeClient.fetch<SanityCustomer | null>(CHECKOUT_CUSTOMER_QUERY, {phone: normalizedPhone})
  const customerId = existingCustomer?._id ?? `customer.${randomUUID()}`

  // 4. Create the order and decrement stock in ONE atomic transaction.
  //    Exactly one patch per product (its stock is shared across sizes), pinned
  //    to the `_rev` we just read (optimistic concurrency). If a product changed
  //    on the server between read and write — e.g. a concurrent order drained
  //    the stock — Sanity aborts the entire commit, so we never create a phantom
  //    order or oversell.
  try {
    const tx = writeClient
      .transaction()
      .create({
        _type: 'order',
        orderNumber,
        status: 'new',
        customer,
        customerRecord: {_type: 'reference', _ref: customerId},
        items: [...lineMap.values()].map((l) => ({
          _key: `${l.productId}-${l.ml ?? 'd'}`,
          product: {_type: 'reference', _ref: l.productId},
          nameSnapshot: l.nameSnapshot,
          ml: l.ml,
          qty: l.qty,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
        pricing: {subtotal, discount, shipping, packaging, total, currency},
        paymentMethod,
        couponCode,
        placedAt,
      })

    if (existingCustomer) {
      tx.patch(customerId, (patch) =>
        patch
          .ifRevisionId(existingCustomer._rev)
          .set({
            name: customer.name,
            phone: normalizedPhone,
            email: customer.email,
            city: customer.city,
            address: customer.address,
            lastOrderAt: placedAt,
          })
          .setIfMissing({orderCount: 0, firstOrderAt: placedAt})
          .inc({orderCount: 1}),
      )
    } else {
      tx.create({
        _id: customerId,
        _type: 'customer',
        name: customer.name,
        phone: normalizedPhone,
        email: customer.email,
        city: customer.city,
        address: customer.address,
        orderCount: 1,
        firstOrderAt: placedAt,
        lastOrderAt: placedAt,
      })
    }

    for (const agg of perProduct.values()) {
      tx.patch(agg.product._id, (patch) =>
        patch.ifRevisionId(agg.product._rev).set({
          stock: (agg.product.stock ?? 0) - agg.total,
        }),
      )
    }

    await tx.commit()
    return {ok: true, orderNumber, total, discount, currency}
  } catch (err) {
    const raw = err instanceof Error ? err.message : ''
    // Sanity returns a transactionError for a failed ifRevisionID condition.
    if (/revision|ifRevisionID|Transaction.*failed|conditions/i.test(raw)) {
      return {
        ok: false,
        error: 'Some items changed or sold out while you were checking out. Please review your basket and try again.',
      }
    }
    return {ok: false, error: raw || 'We could not place your order'}
  }
}
