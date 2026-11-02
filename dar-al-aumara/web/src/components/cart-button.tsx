'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {count} from '@/lib/cart'

/**
 * Header basket button. Shows the live item count from the localStorage cart and
 * refreshes whenever `addLine`/`setQty`/`clearCart` dispatch the cart event.
 */
export function CartButton() {
  const [n, setN] = useState(0)

  useEffect(() => {
    const sync = () => setN(count())
    sync()
    window.addEventListener('aumara:cart', sync)
    return () => window.removeEventListener('aumara:cart', sync)
  }, [])

  return (
    <Link
      href="/cart"
      className="relative rounded-lg border border-black/10 px-3 py-1.5 text-zinc-700 hover:border-black/30 dark:border-white/15 dark:text-zinc-300"
    >
      Basket
      {n > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-white">
          {n}
        </span>
      )}
    </Link>
  )
}
