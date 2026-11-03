import {notFound} from 'next/navigation'
import {PortableText} from 'next-sanity'
import type {Metadata} from 'next'
import {sanityFetch} from '@/sanity/lib/live'
import {client} from '@/sanity/lib/client'
import {PRODUCT_BY_SLUG_QUERY, PRODUCT_SLUGS_QUERY} from '@/sanity/lib/queries'
import {SanityImage, type SanityImageValue} from '@/components/sanity-image'
import {ProductCard, type ProductCardData} from '@/components/product-card'
import {AddToCart} from '@/components/add-to-cart'

// Prerender published product pages; revalidate on demand via Live Content.
export async function generateStaticParams() {
  const slugs = await client.withConfig({useCdn: false}).fetch<string[]>(PRODUCT_SLUGS_QUERY)
  return (slugs ?? []).map((slug: string) => ({slug}))
}

// Metadata is fetched through the plain (non-live, no-stega) client so invisible
// Content Source Map characters never leak into <title>/<meta> and break SEO.
export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  'use cache'

  const {slug} = await params
  const product = await client.fetch(PRODUCT_BY_SLUG_QUERY, {slug})
  if (!product) return {title: 'Product not found'}
  const title = product.seo?.metaTitle || product.nameEn || product.name
  const description = product.seo?.metaDescription || product.shortDescription
  const ogUrl = product.seo?.ogImage?.asset?.url || product.mainImage?.asset?.url
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogUrl ? [{url: ogUrl, alt: product.mainImage?.alt || title}] : undefined,
    },
  }
}

export default async function ProductPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {data: product} = await sanityFetch({query: PRODUCT_BY_SLUG_QUERY, params: {slug}})

  if (!product) notFound()

  const notes = product.fragranceNotes ?? {}
  const sizes = (product.sizes ?? []) as {ml: number; price: number; label?: string}[]
  const recommended = (
    (product.recommended ?? []) as unknown as (ProductCardData | null)[]
  ).filter((item): item is ProductCardData => item !== null && Boolean(item._id && item.slug))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-900">
            {product.mainImage ? (
              <SanityImage value={product.mainImage} width={800} height={800} className="h-full w-full object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-400">No image</div>
            )}
          </div>
          {Array.isArray(product.gallery) && product.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.gallery.map((g: SanityImageValue, i: number) => (
                <div key={g.asset?._id ?? i} className="aspect-square overflow-hidden rounded-lg bg-zinc-50 dark:bg-zinc-900">
                  <SanityImage value={g} width={200} height={200} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            {product.brand?.nameEn && <p className="text-sm uppercase tracking-wide text-zinc-500">{product.brand.nameEn}</p>}
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{product.name}</h1>
            {product.nameEn && <p className="text-lg text-zinc-600 dark:text-zinc-400">{product.nameEn}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {Number(product.price).toFixed(3)} {product.currency ?? 'KWD'}
            </span>
            {product.oldPrice != null && product.oldPrice > product.price && (
              <span className="text-lg text-zinc-400 line-through">
                {Number(product.oldPrice).toFixed(3)} {product.currency ?? 'KWD'}
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-zinc-700 dark:text-zinc-300">{product.shortDescription}</p>
          )}

          <AddToCart
            productId={product._id}
            name={product.name}
            slug={product.slug}
            sizes={sizes}
            currency={product.currency ?? 'KWD'}
            stock={product.stock ?? 0}
          />

          <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <NoteColumn title="Top" notes={notes.top as string[] | undefined} />
              <NoteColumn title="Heart" notes={notes.middle as string[] | undefined} />
              <NoteColumn title="Base" notes={notes.base as string[] | undefined} />
            </dl>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {product.concentration && <Meta label="Concentration" value={product.concentration} />}
              {typeof product.longevity === 'number' && <Meta label="Longevity" value={`${product.longevity}/5`} />}
              {typeof product.sillage === 'number' && <Meta label="Sillage" value={`${product.sillage}/5`} />}
              {typeof product.strength === 'number' && <Meta label="Strength" value={`${product.strength}/5`} />}
            </dl>
          </div>

          {Array.isArray(product.description) && product.description.length > 0 && (
            <div className="prose prose-zinc max-w-none dark:prose-invert">
              <PortableText value={product.description} />
            </div>
          )}
        </div>
      </div>

      {recommended.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">You may also like</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function NoteColumn({title, notes}: {title: string; notes?: string[]}) {
  return (
    <div>
      <dt className="font-medium text-zinc-900 dark:text-zinc-50">{title}</dt>
      <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
        {notes && notes.length > 0 ? notes.join(', ') : '—'}
      </dd>
    </div>
  )
}

function Meta({label, value}: {label: string; value: string}) {
  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-800 dark:text-zinc-200">{value}</dd>
    </>
  )
}
