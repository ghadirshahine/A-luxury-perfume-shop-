'use server'

import {client} from '@/sanity/lib/client'
import {CHECKOUT_PRODUCT_QUERY} from '@/sanity/lib/queries'

export type CartSnapshotLine = {
  _id: string
  slug?: string
  name?: string
  price: number
  currency?: string
  stock?: number
  sizes?: {ml: number; price: number; label?: string}[]
}

/**
 * Server action: given the product ids in the shopper's localStorage cart,
 * return live price + stock from Sanity. The cart page renders from this so a
 * stale or tampered client cart never shows wrong prices or available stock.
 *
 * Uses the read-only CDN-less client (no token): this is a public, hot path and
 * must not touch the write token. The authoritative stock check happens again
 * in `createOrder` when the order is actually placed.
 */
export async function getCartSnapshot(ids: string[]): Promise<CartSnapshotLine[]> {
  if (ids.length === 0) return []
  return client
    .withConfig({useCdn: false})
    .fetch<CartSnapshotLine[]>(CHECKOUT_PRODUCT_QUERY, {ids: ids.slice(0, 50)})
}
