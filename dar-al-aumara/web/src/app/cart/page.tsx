'use client'

import {startTransition, useCallback, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {getLines, setQty, clearCart, type CartLine} from '@/lib/cart'
import {getCartSnapshot, type CartSnapshotLine} from '@/app/actions/cart-snapshot'
import {createOrder, type CheckoutResult} from '@/app/actions/create-order'

type Row = CartLine & {live?: CartSnapshotLine}

function money(n: number, currency = 'KWD') {
  return `${n.toFixed(3)} ${currency}`
}

/**
 * The basket. Quantities live in localStorage, but prices and stock caps are
 * hydrated from Sanity via `getCartSnapshot`, and checkout re-validates on the
 * server. Editing quantity here never trusts a client-side price.
 */
export default function CartPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [customer, setCustomer] = useState({name: '', phone: '', email: '', city: '', address: ''})
  const [paymentMethod, setPaymentMethod] = useState<'knet' | 'card' | 'applepay' | 'paypal' | 'cod'>('cod')

  const hydrate = useCallback(async (lines: CartLine[]) => {
    setLoading(true)
    const snap = await getCartSnapshot(lines.map((l) => l.productId))
    const byId = new Map(snap.map((s) => [s._id, s]))
    setRows(lines.map((l) => ({...l, live: byId.get(l.productId)})))
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => hydrate(getLines()))
  }, [hydrate])

  const currency = rows[0]?.live?.currency ?? 'KWD'

  const totals = useMemo(() => {
    let subtotal = 0
    for (const r of rows) {
      const size = r.ml != null ? r.live?.sizes?.find((s) => s.ml === r.ml) : undefined
      const unit = size?.price ?? r.live?.price ?? 0
      subtotal += unit * r.qty
    }
    const shipping = subtotal >= 20 || subtotal === 0 ? 0 : 1
    return {subtotal, shipping, total: subtotal + shipping}
  }, [rows])

  function updateQty(r: Row, next: number) {
    const max = r.live?.stock ?? 99
    const clamped = Math.max(0, Math.min(next, max))
    setQty(r.productId, r.ml, clamped)
    hydrate(getLines())
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    setPlacing(true)
    setResult(null)
    const res = await createOrder({
      items: rows.map((r) => ({productId: r.productId, ml: r.ml, qty: r.qty})),
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || undefined,
        city: customer.city || undefined,
        address: customer.address || undefined,
      },
      paymentMethod,
      couponCode: couponCode.trim() || undefined,
    })
    setResult(res)
    setPlacing(false)
    if (res.ok) {
      clearCart()
      hydrate([])
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-500">Loading your basket…</main>
  }

  if (result?.ok) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 dark:border-emerald-900 dark:bg-emerald-950">
          <h1 className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">Order placed 🎉</h1>
          <p className="mt-2 text-emerald-800 dark:text-emerald-200">
            Reference <span className="font-mono font-semibold">{result.orderNumber}</span> ·{' '}
            {money(result.total, result.currency)}
          </p>
          {result.discount > 0 && <p className="mt-2 text-emerald-800 dark:text-emerald-200">Coupon discount: {money(result.discount, result.currency)}</p>}
          <Link href="/products" className="mt-6 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
            Continue shopping
          </Link>
        </div>
      </main>
    )
  }

  if (rows.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your basket is empty</h1>
        <Link href="/products" className="mt-4 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
          Browse fragrances
        </Link>
      </main>
    )
  }

  const canCheckout = customer.name.trim().length >= 2 && customer.phone.trim().length >= 6

  return (
    <main className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[1fr_360px]">
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Your basket</h1>
        {rows.map((r) => {
          const size = r.ml != null ? r.live?.sizes?.find((s) => s.ml === r.ml) : undefined
          const unit = size?.price ?? r.live?.price ?? 0
          const stock = r.live?.stock ?? 0
          return (
            <div key={`${r.productId}:${r.ml ?? 'd'}`} className="flex items-center justify-between gap-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="min-w-0">
                <p className="truncate font-medium">{r.live?.name ?? r.name}</p>
                <p className="text-sm text-zinc-500">
                  {r.ml ? `${r.ml} ml · ` : ''}
                  {money(unit, r.live?.currency ?? currency)}
                  {stock <= 0 && ' · out of stock'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-black/10 dark:border-white/15">
                  <button type="button" aria-label={`Decrease quantity of ${r.live?.name ?? r.name}`} onClick={() => updateQty(r, r.qty - 1)} className="px-2.5 py-1">−</button>
                  <span className="w-6 text-center text-sm tabular-nums">{r.qty}</span>
                  <button type="button" aria-label={`Increase quantity of ${r.live?.name ?? r.name}`} onClick={() => updateQty(r, r.qty + 1)} disabled={r.qty >= stock} className="px-2.5 py-1 disabled:opacity-40">+</button>
                </div>
                <button type="button" aria-label={`Remove ${r.live?.name ?? r.name} from basket`} onClick={() => updateQty(r, 0)} className="text-sm text-zinc-400 hover:text-red-600">Remove</button>
              </div>
            </div>
          )
        })}
      </section>

      <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-lg font-semibold">Checkout</h2>

        <form onSubmit={placeOrder} className="flex flex-col gap-3">
          <label className="sr-only" htmlFor="coName">Full name</label>
          <input id="coName" className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15" placeholder="Full name *" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
          <label className="sr-only" htmlFor="coPhone">Phone</label>
          <input id="coPhone" type="tel" inputMode="tel" className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15" placeholder="Phone *" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} />
          <label className="sr-only" htmlFor="coEmail">Email</label>
          <input id="coEmail" type="email" className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15" placeholder="Email" value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})} />
          <label className="sr-only" htmlFor="coCity">City</label>
          <input id="coCity" className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15" placeholder="City" value={customer.city} onChange={(e) => setCustomer({...customer, city: e.target.value})} />
          <label className="sr-only" htmlFor="coAddress">Address</label>
          <textarea id="coAddress" className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15" placeholder="Address" rows={2} value={customer.address} onChange={(e) => setCustomer({...customer, address: e.target.value})} />
          <label className="sr-only" htmlFor="coPay">Payment method</label>
          <select id="coPay" className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 dark:bg-black" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}>
            <option value="cod">Cash on delivery</option>
            <option value="knet">KNET</option>
            <option value="card">Card</option>
            <option value="applepay">Apple Pay</option>
            <option value="paypal">PayPal</option>
          </select>

          <label className="sr-only" htmlFor="coCoupon">Coupon code</label>
          <input id="coCoupon" className="rounded-lg border border-black/10 px-3 py-2 text-sm uppercase dark:border-white/15 dark:bg-black" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />

          <dl className="mt-2 flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd>{money(totals.subtotal, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Shipping</dt><dd>{totals.shipping === 0 ? 'Free' : money(totals.shipping, currency)}</dd></div>
            <div className="flex justify-between border-t border-black/10 pt-1 font-semibold dark:border-white/10"><dt>Total</dt><dd>{money(totals.total, currency)}</dd></div>
          </dl>

          {result && !result.ok && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{result.error}</p>}

          <button type="submit" disabled={!canCheckout || placing} className="mt-1 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            {placing ? 'Placing order…' : 'Place order'}
          </button>
          <p className="text-xs text-zinc-400">Stock is verified on the server against live Sanity data.</p>
        </form>
      </aside>
    </main>
  )
}
