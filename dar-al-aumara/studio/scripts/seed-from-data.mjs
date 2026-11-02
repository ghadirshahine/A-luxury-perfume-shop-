#!/usr/bin/env node
/**
 * DAR AL-AUMARA — data.js → Sanity migration / seed.
 *
 * Reads the legacy vanilla catalogue (`../../js/data.js`), extracts BRANDS,
 * CATEGORIES and PRODUCTS, and upserts them into the Sanity dataset as the new
 * content model. Re-runnable: documents are written with `createOrReplace` under
 * deterministic ids derived from the legacy keys, so you can iterate the schema
 * and re-seed without creating duplicates.
 *
 * NOTE ON IDS: the Sanity best practice is to let Sanity generate `_id`s for
 * ordinary documents. This migration intentionally uses stable ids
 * (`brand.umara`, `category.men`, `product.p01`) so references resolve without a
 * second lookup pass and the script stays idempotent. Editor-created documents
 * after this run will use generated ids as normal.
 *
 * Usage:
 *   SANITY_API_WRITE_TOKEN=pat_... node scripts/seed-from-data.mjs
 * Optional overrides:
 *   SANITY_PROJECT_ID (default xvmhw7dr), SANITY_DATASET (default production)
 */

import {readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const projectId = process.env.SANITY_PROJECT_ID || 'xvmhw7dr'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = '2026-02-01'
const token = process.env.SANITY_API_WRITE_TOKEN || ''

if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN. Create a write token in Sanity → API → Tokens.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})

/* ------------------------------------------------------------------ *
 * Load the legacy data.js (top-level `const` declarations) into objects.
 * data.js is a browser script with no exports, so we evaluate it in a function
 * scope and return the globals we need.
 * ------------------------------------------------------------------ */
const dataPath = join(__dirname, '..', '..', '..', 'js', 'data.js')
const src = readFileSync(dataPath, 'utf8')
const load = new Function(`${src}\n;return {BRANDS, CATEGORIES, PRODUCTS};`)
const {BRANDS, CATEGORIES, PRODUCTS} = load()

/** Turn a plain string into a single-paragraph Portable Text block array. */
function toPortableText(text) {
  if (!text) return undefined
  return [
    {
      _type: 'block',
      markDefs: [],
      children: [{_type: 'span', text: String(text), marks: []}],
    },
  ]
}

const ref = (id) => ({_type: 'reference', _ref: id})
const keyRef = (id, key) => ({_key: key, _type: 'reference', _ref: id})

/* ------------------------------------------------------------------ *
 * Brands
 * ------------------------------------------------------------------ */
async function seedBrands() {
  const entries = Object.entries(BRANDS)
  for (const [key, b] of entries) {
    await client.createOrReplace({
      _id: `brand.${key}`,
      _type: 'brand',
      name: b.ar,
      nameEn: b.en,
      slug: {current: key},
      legacyId: key,
      description: b.desc,
      accentColor: b.accent,
    })
  }
  console.log(`✓ brands: ${entries.length}`)
}

/* ------------------------------------------------------------------ *
 * Categories (legacy array has Arabic titles only; English title derived
 * from the id so the slug source produces a stable slug).
 * ------------------------------------------------------------------ */
function titleEnFromId(id) {
  return id.charAt(0).toUpperCase() + id.slice(1)
}

async function seedCategories() {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    await client.createOrReplace({
      _id: `category.${c.id}`,
      _type: 'category',
      title: c.ar,
      titleEn: titleEnFromId(c.id),
      slug: {current: c.id},
      legacyId: c.id,
      accentColor: c.accent,
      order: i,
    })
  }
  console.log(`✓ categories: ${CATEGORIES.length}`)
}

/* ------------------------------------------------------------------ *
 * Products — mapped field-by-field to the Sanity `product` type.
 * ------------------------------------------------------------------ */
async function seedProducts() {
  // Create every product before writing product-to-product references.
  for (const p of PRODUCTS) {
    const doc = {
      _id: `product.${p.id}`,
      _type: 'product',
      legacyId: p.id,
      name: p.name_ar,
      nameEn: p.name_en,
      slug: {current: p.slug},
      brand: ref(`brand.${p.brand}`),
      shortDescription: p.short_ar,
      description: toPortableText(p.description_ar),
      fragranceNotes: {
        top: p.notes?.top ?? [],
        middle: p.notes?.middle ?? [],
        base: p.notes?.base ?? [],
      },
      concentration: p.concentration,
      strength: p.tags?.strength,
      longevity: p.longevity,
      sillage: p.sillage,
      price: p.price,
      currency: p.currency ?? 'KWD',
      sizes: (p.sizes ?? []).map((s) => ({
        _key: `size-${s.ml}`,
        ml: s.ml,
        price: s.price,
        label: s.label,
      })),
      stock: p.stock ?? 0,
      categories: (p.categories ?? []).map((c) => keyRef(`category.${c}`, c)),
      gender: p.tags?.gender ?? [],
      families: p.tags?.families ?? [],
      occasions: p.tags?.occasions ?? [],
      seasons: p.tags?.seasons ?? [],
      badges: p.badges ?? [],
      // Surface bestsellers on the home page so the featured grid is populated.
      featured: Boolean(p.bestsellerRank) && p.bestsellerRank <= 8,
      isNew: Boolean(p.isNew),
      bestsellerRank: p.bestsellerRank ?? undefined,
      // Keep the compare-at price only when it is genuinely higher (schema rule).
      oldPrice: typeof p.oldPrice === 'number' && p.oldPrice > p.price ? p.oldPrice : undefined,
      seo: p.short_ar ? {metaDescription: p.short_ar} : undefined,
    }

    // Images in data.js are procedural `art` descriptors, not real files, so we
    // cannot upload them here. Editors attach mainImage / gallery in the Studio.
    await client.createOrReplace(doc)
  }

  for (const p of PRODUCTS) {
    await client.patch(`product.${p.id}`).set({
      recommended: (p.recommended ?? []).map((id) => keyRef(`product.${id}`, id)),
      coPurchase: (p.coPurchase ?? []).map((id) => keyRef(`product.${id}`, id)),
    }).commit()
  }

  console.log(`✓ products: ${PRODUCTS.length}`)
}

async function main() {
  console.log(`Seeding ${projectId} / ${dataset} from data.js …`)
  await seedBrands()
  await seedCategories()
  await seedProducts()
  console.log('Done. Open the Studio to review, upload images, then publish.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
