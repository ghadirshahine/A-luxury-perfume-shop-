import {Suspense} from 'react'
import {sanityFetch} from '@/sanity/lib/live'
import {BRANDS_QUERY, CATEGORIES_QUERY, FILTERED_PRODUCTS_QUERY} from '@/sanity/lib/queries'
import {ProductCard, type ProductCardData} from '@/components/product-card'

type ProductsSearchParams = {
  q?: string
  category?: string
  brand?: string
  available?: string
}

type CategoryOption = {slug: string; title: string}
type BrandOption = {slug: string; name: string; nameEn?: string}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>
}) {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>
}) {
  const filters = await searchParams
  const search = (filters.q ?? '').trim().replace(/[?*]/g, '').slice(0, 80)
  const params = {
    search: search ? `*${search}*` : '',
    category: (filters.category ?? '').slice(0, 100),
    brand: (filters.brand ?? '').slice(0, 100),
    available: filters.available === 'on',
  }
  const [{data: products}, {data: categories}, {data: brands}] = await Promise.all([
    sanityFetch({query: FILTERED_PRODUCTS_QUERY, params}),
    sanityFetch({query: CATEGORIES_QUERY}),
    sanityFetch({query: BRANDS_QUERY}),
  ])
  const items = (products ?? []) as ProductCardData[]
  const categoryOptions = (categories ?? []) as CategoryOption[]
  const brandOptions = (brands ?? []) as BrandOption[]

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          All fragrances
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {items.length} fragrance{items.length === 1 ? '' : 's'}
        </p>
      </header>

      <form action="/products" method="get" className="grid gap-3 border-y border-black/10 py-5 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,2fr)_1fr_1fr_auto_auto] lg:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span>Search</span>
          <input name="q" type="search" defaultValue={search} placeholder="Name or brand" className="min-h-11 rounded border border-black/20 bg-transparent px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Category</span>
          <select name="category" defaultValue={params.category} className="min-h-11 rounded border border-black/20 bg-transparent px-3">
            <option value="">All categories</option>
            {categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Brand</span>
          <select name="brand" defaultValue={params.brand} className="min-h-11 rounded border border-black/20 bg-transparent px-3">
            <option value="">All brands</option>
            {brandOptions.map((brand) => <option key={brand.slug} value={brand.slug}>{brand.name} {brand.nameEn ? `· ${brand.nameEn}` : ''}</option>)}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input name="available" type="checkbox" defaultChecked={params.available} />
          In stock
        </label>
        <button type="submit" className="min-h-11 rounded bg-zinc-900 px-5 font-medium text-white">Filter</button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
          No products yet. Create and publish products in the Studio.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}

function ProductsFallback() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        All fragrances
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">Loading fragrances...</p>
    </main>
  )
}
