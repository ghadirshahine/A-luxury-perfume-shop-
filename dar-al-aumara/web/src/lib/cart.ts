'use client'

/**
 * Minimal, dependency-free cart persisted in localStorage. This is the Next.js
 * storefront's own cart (the vanilla prototype in ../js is untouched).
 *
 * Prices and stock always come from Sanity at render time; the cart stores only
 * identifiers and the chosen size so a later re-fetch reflects live data. The
 * checkout server action re-validates every line against live `stock`, so a
 * tampered or stale localStorage cart can never over-commit inventory.
 */

export type CartLine = {
  productId: string
  slug: string
  name: string
  ml?: number
  qty: number
}

const KEY = 'aumara.cart.v1'

function read(): Record<string, CartLine> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}') as Record<string, CartLine>
  } catch {
    return {}
  }
}

function write(cart: Record<string, CartLine>) {
  window.localStorage.setItem(KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('aumara:cart'))
}

/** Stable key per product+size so different sizes stay separate lines. */
function lineKey(line: Pick<CartLine, 'productId' | 'ml'>) {
  return `${line.productId}:${line.ml ?? 'default'}`
}

export function addLine(line: CartLine) {
  const cart = read()
  const key = lineKey(line)
  const existing = cart[key]
  cart[key] = {
    ...existing,
    ...line,
    qty: (existing?.qty ?? 0) + line.qty,
  }
  write(cart)
}

export function setQty(productId: string, ml: number | undefined, qty: number) {
  const cart = read()
  const key = lineKey({productId, ml})
  if (!cart[key]) return
  if (qty <= 0) delete cart[key]
  else cart[key] = {...cart[key], qty}
  write(cart)
}

export function clearCart() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('aumara:cart'))
}

export function getLines(): CartLine[] {
  return Object.values(read())
}

export function count(): number {
  return getLines().reduce((n, l) => n + l.qty, 0)
}
