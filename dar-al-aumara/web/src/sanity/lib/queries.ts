import {defineQuery} from 'next-sanity'

/**
 * GROQ queries for the storefront. Query variable names are unique so TypeGen
 * can generate a distinct result type per query (see typegen.md).
 *
 * Images request `asset->{url, metadata{lqip, dimensions}}` so the SanityImage
 * component can produce blur placeholders and correct aspect ratios (image.md).
 */

const PRODUCT_CARD_FIELDS = `
  _id,
  name,
  nameEn,
  "slug": slug.current,
  price,
  oldPrice,
  currency,
  stock,
  isNew,
  bestsellerRank,
  badges,
  rating,
  reviewsCount,
  "brand": brand->{name, nameEn, slug},
  mainImage{
    alt,
    "asset": asset->{
      _id,
      url,
      metadata {
        lqip,
        dimensions { width, height }
      }
    },
    hotspot,
    crop
  }
`

export const PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && defined(slug.current)] | order(_updatedAt desc) {
    ${PRODUCT_CARD_FIELDS}
  }
`)

export const FILTERED_PRODUCTS_QUERY = defineQuery(`
  *[
    _type == "product" && defined(slug.current) &&
    (!$category || $category in categories[]->slug.current) &&
    (!$brand || brand->slug.current == $brand) &&
    (!$available || stock > 0) &&
    (!$search || name match $search || nameEn match $search || brand->name match $search || brand->nameEn match $search)
  ] | order(_updatedAt desc) {
    ${PRODUCT_CARD_FIELDS}
  }
`)

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(order asc, title asc) {title, "slug": slug.current}
`)

export const BRANDS_QUERY = defineQuery(`
  *[_type == "brand"] | order(name asc) {name, nameEn, "slug": slug.current}
`)

export const ACTIVE_BANNER_QUERY = defineQuery(`
  *[_type == "campaign" && kind == "banner" && active == true &&
    (!defined(startsAt) || dateTime(startsAt) <= dateTime(now())) &&
    (!defined(endsAt) || dateTime(endsAt) > dateTime(now()))
  ] | order(_updatedAt desc)[0] {
    headline,
    body,
    buttonText,
    buttonUrl,
    image {alt, "asset": asset->{_id, url, metadata {lqip, dimensions {width, height}}}, hotspot, crop}
  }
`)

export const FEATURED_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && featured == true && defined(slug.current)] | order(bestsellerRank asc, _updatedAt desc) [0...8] {
    ${PRODUCT_CARD_FIELDS}
  }
`)

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug][0] {
    ${PRODUCT_CARD_FIELDS},
    shortDescription,
    description,
    "concentration": concentration,
    fragranceNotes,
    strength,
    longevity,
    sillage,
    sizes,
    "categories": categories[]->{title, "slug": slug.current},
    gender,
    families,
    occasions,
    seasons,
    "recommended": recommended[]->[_type == "product" && defined(slug.current)]{
      _id, name, nameEn, price, currency, "slug": slug.current,
      mainImage{alt, "asset": asset->{url}}
    },
    "coPurchase": coPurchase[]->{
      _id, name, nameEn, price, currency, "slug": slug.current,
      mainImage{alt, "asset": asset->{url}}
    },
    gallery[]{
      alt,
      "asset": asset->{
        _id, url,
        metadata { lqip, dimensions { width, height } }
      },
      hotspot, crop
    },
    "seo": seo {
      metaTitle, metaDescription,
      ogImage{ "asset": asset->{url}, alt }
    },
    saleEndsAt
  }
`)

export const PRODUCT_SLUGS_QUERY = defineQuery(`
  *[_type == "product" && defined(slug.current)].slug.current
`)

/**
 * Live stock + price lookup for the checkout server action. Keyed by _id so the
 * action can validate each cart line against authoritative Sanity data (never
 * trusting the client) before creating an order. Uses the published (non-draft)
 * id set only.
 */
export const CHECKOUT_PRODUCT_QUERY = defineQuery(`
  *[_type == "product" && _id in $ids] {
    _id,
    _rev,
    "slug": slug.current,
    name,
    price,
    oldPrice,
    currency,
    stock,
    sizes
  }
`)

export const CHECKOUT_PROMOTION_QUERY = defineQuery(`
  *[_type == "campaign" && kind == "coupon" && active == true && lower(code) == lower($code)][0] {
    title,
    discountType,
    discountValue,
    minimumSubtotal,
    startsAt,
    endsAt
  }
`)

export const CHECKOUT_CUSTOMER_QUERY = defineQuery(`
  *[_type == "customer" && phone == $phone][0]{_id, _rev}
`)
