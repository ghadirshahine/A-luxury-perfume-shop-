import Link from 'next/link'
import {SanityImage, type SanityImageValue} from '@/components/sanity-image'

export type ProductCardData = {
  _id: string
  name: string
  nameEn?: string
  slug: string
  price: number
  oldPrice?: number | null
  currency?: string
  stock?: number
  isNew?: boolean
  badges?: string[]
  rating?: number
  reviewsCount?: number
  brand?: {name?: string; nameEn?: string; slug?: string} | null
  mainImage?: SanityImageValue | null
}

function formatPrice(value: number, currency = 'KWD') {
  return `${value.toFixed(3)} ${currency}`
}

/**
 * Storefront product card. Reads live data projected from Sanity — no local
 * catalogue. Uses `_id` as the key and the slug for the detail link.
 */
export function ProductCard({product}: {product: ProductCardData}) {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0

  return (
    <article className="flex flex-col rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
      <Link href={`/products/${product.slug}`} className="group block overflow-hidden rounded-lg">
        <div className="aspect-square w-full bg-zinc-50 dark:bg-zinc-900">
          {product.mainImage ? (
            <SanityImage
              value={product.mainImage}
              width={400}
              height={400}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <span className="text-xs">{product.nameEn || product.name}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        {product.brand?.nameEn && (
          <p className="text-xs uppercase tracking-wide text-zinc-500">{product.brand.nameEn}</p>
        )}
        <Link href={`/products/${product.slug}`} className="mt-1">
          <h3 className="font-medium leading-snug text-zinc-900 hover:underline dark:text-zinc-50">
            {product.name}
          </h3>
          {product.nameEn && <p className="text-sm text-zinc-500">{product.nameEn}</p>}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatPrice(product.price, product.currency)}
          </span>
          {discount > 0 && product.oldPrice != null && (
            <span className="text-sm text-zinc-400 line-through">
              {formatPrice(product.oldPrice, product.currency)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          {(product.badges ?? []).map((badge) => (
            <span key={badge} className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {badge}
            </span>
          ))}
          {typeof product.stock === 'number' && product.stock <= 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700 dark:bg-red-950 dark:text-red-300">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
