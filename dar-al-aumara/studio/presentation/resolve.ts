import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

/**
 * Presentation resolver for the standalone Studio. Maps each document type to
 * the route it appears on in the sibling Next.js storefront, so editors get
 * click-through navigation and the live preview iframe loads the right page.
 */
export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    product: defineLocations({
      select: {name: 'name', nameEn: 'nameEn', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.nameEn || doc?.name || 'Product',
            href: `/products/${doc?.slug ?? ''}`,
          },
          {title: 'All products', href: '/products'},
        ],
      }),
    }),
    brand: defineLocations({
      select: {name: 'name', nameEn: 'nameEn', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [
          {title: doc?.nameEn || doc?.name || 'Brand', href: `/products?brand=${doc?.slug ?? ''}`},
          {title: 'All products', href: '/products'},
        ],
      }),
    }),
    category: defineLocations({
      select: {title: 'title', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [
          {title: doc?.title || 'Category', href: `/products?category=${doc?.slug ?? ''}`},
          {title: 'All products', href: '/products'},
        ],
      }),
    }),
  },
}
