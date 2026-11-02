'use client'

import {useMemo, useState} from 'react'
import {addLine} from '@/lib/cart'

type Size = {ml: number; price: number; label?: string}

type AddToCartProps = {
  productId: string
  name: string
  slug: string
  sizes: Size[]
  currency?: string
  /** Live stock from Sanity. Drives the disabled / capped state. */
  stock: number
}

/**
 * Stock-aware "add to basket" control. The quantity a shopper can select is
 * capped by the product's live `stock` field from Sanity; when stock is 0 the
 * control is disabled and shows an out-of-stock message. Adding to the cart is
 * only a client-side intent — the checkout server action re-checks stock before
 * an order is created, so this is a UX guard, not the source of truth.
 */
export function AddToCart({productId, name, slug, sizes, currency = 'KWD', stock}: AddToCartProps) {
  const hasSizes = sizes.length > 0
  const [selectedSize, setSelectedSize] = useState<Size | undefined>(sizes[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const outOfStock = stock <= 0
  const maxQty = useMemo(() => Math.max(1, Math.min(stock, 99)), [stock])

  const price = hasSizes ? (selectedSize?.price ?? 0) : 0

  function handleAdd() {
    if (outOfStock) return
    addLine({
      productId,
      slug,
      name,
      ml: selectedSize?.ml,
      qty,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  if (outOfStock) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        Out of stock — restocking soon.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {hasSizes && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Size</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selectedSize?.ml === size.ml
              return (
                <button
                  key={size.ml}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={
                    'rounded-lg border px-3 py-2 text-sm transition ' +
                    (active
                      ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : 'border-black/10 text-zinc-700 hover:border-black/30 dark:border-white/15 dark:text-zinc-300')
                  }
                >
                  {size.label ?? `${size.ml} ml`}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-black/10 dark:border-white/15">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            className="px-3 py-2 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {added ? 'Added ✓' : `Add to basket · ${(price * qty).toFixed(3)} ${currency}`}
        </button>
      </div>

      {stock <= 10 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Only {stock} left in stock.</p>
      )}
    </div>
  )
}
