import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {ACTIVE_BANNER_QUERY, FEATURED_PRODUCTS_QUERY} from '@/sanity/lib/queries'
import {ProductCard, type ProductCardData} from '@/components/product-card'
import {SanityImage, type SanityImageValue} from '@/components/sanity-image'

export default async function HomePage() {
  const [{data: products}, {data: banner}] = await Promise.all([
    sanityFetch({query: FEATURED_PRODUCTS_QUERY}),
    sanityFetch({query: ACTIVE_BANNER_QUERY}),
  ])
  const featured = (products ?? []) as ProductCardData[]

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          دار الأُمراء — DAR AL-AUMARA
        </h1>
        <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          دار العطور الفاخرة. Live catalogue served from Sanity — edit products in the Studio and
          see them here in real time.
        </p>
        <Link
          href="/products"
          className="mt-2 rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          Browse all fragrances
        </Link>
      </section>

      {banner?.headline && (
        <section className="relative isolate overflow-hidden border border-amber-200/20 bg-[#14110d] px-6 py-10 sm:px-10">
          {banner.image && (
            <div className="absolute inset-0 -z-10 opacity-30">
              <SanityImage value={banner.image as SanityImageValue} width={1200} height={480} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="max-w-2xl">
            <p className="mb-2 text-sm text-amber-200">عرض من دار الأُمراء</p>
            <h2 className="text-3xl font-semibold text-amber-100">{banner.headline}</h2>
            {banner.body && <p className="mt-2 text-zinc-200">{banner.body}</p>}
            {banner.buttonText && (
              <Link href={banner.buttonUrl?.startsWith('/') ? banner.buttonUrl : '/products'} className="mt-5 inline-flex min-h-11 items-center border border-amber-200/50 px-5 text-amber-100 hover:bg-amber-100/10">
                {banner.buttonText}
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Featured</h2>
          <Link href="/products" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
            View all →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
            No featured products yet. Publish a product in the Studio and set{' '}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">featured</code> to true.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
