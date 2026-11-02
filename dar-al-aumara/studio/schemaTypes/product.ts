import {defineArrayMember, defineField, defineType} from 'sanity'

/* ---------------- Static option sets ----------------
   Mirror the previous catalogue dictionaries so editors pick from a controlled
   vocabulary. Declared before the schema so the field options below can
   reference them without hitting the temporal dead zone at module load. */
const NOTE_OPTIONS = [
  'bergamot', 'saffron', 'rose', 'oud', 'amber', 'musk', 'sandalwood', 'lychee', 'peony',
  'cinnamon', 'blood-orange', 'frankincense', 'vanilla', 'tonka', 'orange-blossom', 'lily',
  'cardamom', 'nutmeg', 'leather', 'patchouli', 'lemon', 'neroli', 'geranium', 'cedar',
  'pink-pepper', 'jasmine', 'tuberose', 'cypress', 'almond', 'orchid', 'pear', 'basil',
  'grapefruit', 'sage', 'vetiver', 'sea', 'chocolate',
]

const FAMILY_OPTIONS = [
  'woody', 'oriental', 'floral', 'citrus', 'sweet', 'fresh', 'spicy', 'oud', 'musk', 'gourmand', 'aquatic', 'aromatic',
]

const OCCASION_OPTIONS = ['daily', 'work', 'special', 'evening', 'travel', 'sport']

/**
 * Product — the DAR AL-AUMARA fragrance catalogue item.
 *
 * Modelled as data, not presentation. Reusable entities (brand, categories,
 * related products) are `reference`s; document-specific structure (fragrance
 * note pyramid, sizes, SEO) is nested.
 */
export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'fragrance', title: 'Fragrance'},
    {name: 'commerce', title: 'Commerce'},
    {name: 'discoverability', title: 'Discoverability'},
    {name: 'seo', title: 'SEO'},
  ],
  fieldsets: [
    {name: 'identity', title: 'Identity', options: {columns: 2}},
  ],
  fields: [
    /* ---------------- Basics ---------------- */
    defineField({
      name: 'name',
      title: 'Name (Arabic)',
      type: 'string',
      group: 'basics',
      fieldset: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nameEn',
      title: 'Name (English)',
      type: 'string',
      group: 'basics',
      fieldset: 'identity',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basics',
      fieldset: 'identity',
      options: {
        source: (doc) => String(doc?.nameEn || doc?.name || ''),
      },
      validation: (rule) =>
        rule.required().custom(async (slug, context) => {
          if (!slug?.current) return true
          const client = context.getClient({apiVersion: '2026-02-01'})
          const id = context.document?._id?.replace(/^drafts\./, '')
          const draftId = id ? `drafts.${id}` : undefined
          const existing = await client.fetch(
            `count(*[_type == "product" && slug.current == $slug && _id != $id && _id != $draftId])`,
            {slug: slug.current, id, draftId},
          )
          return existing === 0 || 'This slug is already used by another product'
        }),
    }),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'reference',
      to: [{type: 'brand'}],
      group: 'basics',
      fieldset: 'identity',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      description: 'Stable id from the previous catalogue (e.g. p01). Used by the migration; never edited by hand.',
      type: 'string',
      group: 'basics',
      readOnly: true,
    }),

    /* ---------------- Fragrance ---------------- */
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 2,
      group: 'fragrance',
      validation: (rule) => rule.max(160).warning('Keep it under 160 characters for card previews.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'fragrance',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'fragranceNotes',
      title: 'Fragrance Notes',
      type: 'object',
      group: 'fragrance',
      fields: [
        defineField({
          name: 'top',
          title: 'Top notes',
          type: 'array',
          of: [defineArrayMember({type: 'string', options: {list: NOTE_OPTIONS}})],
        }),
        defineField({
          name: 'middle',
          title: 'Heart notes',
          type: 'array',
          of: [defineArrayMember({type: 'string', options: {list: NOTE_OPTIONS}})],
        }),
        defineField({
          name: 'base',
          title: 'Base notes',
          type: 'array',
          of: [defineArrayMember({type: 'string', options: {list: NOTE_OPTIONS}})],
        }),
      ],
    }),
    defineField({
      name: 'concentration',
      title: 'Concentration',
      type: 'string',
      group: 'fragrance',
      options: {list: ['EDP', 'EDT', 'Parfum', 'Extrait', 'Bakhoor', 'SET'], layout: 'radio'},
      initialValue: 'EDP',
    }),
    defineField({
      name: 'strength',
      title: 'Scent strength',
      description: '1 = very light ... 5 = very strong',
      type: 'number',
      group: 'fragrance',
      options: {list: [1, 2, 3, 4, 5]},
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'longevity',
      title: 'Longevity',
      description: 'How long it lasts on skin, 1-5',
      type: 'number',
      group: 'fragrance',
      options: {list: [1, 2, 3, 4, 5]},
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'sillage',
      title: 'Sillage',
      description: 'The scent trail it leaves, 1-5',
      type: 'number',
      group: 'fragrance',
      options: {list: [1, 2, 3, 4, 5]},
      validation: (rule) => rule.min(1).max(5),
    }),

    /* ---------------- Commerce ---------------- */
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'commerce',
      validation: (rule) => rule.required().min(0).error('Price must be a positive number'),
    }),
    defineField({
      name: 'oldPrice',
      title: 'Compare-at price',
      description: 'Optional. Set higher than price to show a discount.',
      type: 'number',
      group: 'commerce',
      validation: (rule) =>
        rule.custom((value, context) => {
          const price = context.document?.price
          if (value != null && typeof price === 'number' && value <= price) {
            return 'Compare-at price should be higher than the price'
          }
          return true
        }),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      group: 'commerce',
      options: {list: ['KWD', 'SAR', 'AED', 'USD'], layout: 'radio'},
      initialValue: 'KWD',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      group: 'commerce',
      of: [
        defineArrayMember({
          name: 'size',
          title: 'Size',
          type: 'object',
          fields: [
            defineField({name: 'ml', title: 'Volume (ml)', type: 'number', validation: (rule) => rule.required().min(0)}),
            defineField({name: 'price', title: 'Price', type: 'number', validation: (rule) => rule.required().min(0)}),
            defineField({name: 'label', title: 'Label override', type: 'string'}),
          ],
          preview: {
            select: {ml: 'ml', price: 'price', label: 'label'},
            prepare: ({ml, price, label}) => ({
              title: label || `${ml} ml`,
              subtitle: price != null ? `${price} KWD` : undefined,
            }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1).error('Add at least one size'),
    }),
    defineField({
      name: 'stock',
      title: 'Stock quantity',
      type: 'number',
      group: 'commerce',
      initialValue: 0,
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'saleEndsAt',
      title: 'Sale ends at',
      description: 'Optional deadline to drive a countdown on the storefront.',
      type: 'datetime',
      group: 'commerce',
    }),

    /* ---------------- Discoverability ---------------- */
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      group: 'discoverability',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text matters for SEO'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'discoverability',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
        }),
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
    }),
    defineField({
      name: 'gender',
      title: 'Gender',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'string', options: {list: ['men', 'women', 'unisex']}})],
    }),
    defineField({
      name: 'families',
      title: 'Olfactive families',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'string', options: {list: FAMILY_OPTIONS}})],
    }),
    defineField({
      name: 'occasions',
      title: 'Occasions',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'string', options: {list: OCCASION_OPTIONS}})],
    }),
    defineField({
      name: 'seasons',
      title: 'Seasons',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'string', options: {list: ['spring', 'summer', 'autumn', 'winter', 'all']}})],
    }),
    defineField({
      name: 'badges',
      title: 'Badges',
      type: 'array',
      group: 'discoverability',
      of: [
        defineArrayMember({
          type: 'string',
          options: {list: ['bestseller', 'new', 'limited', 'exclusive', 'gift']},
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on home',
      type: 'boolean',
      group: 'discoverability',
      initialValue: false,
    }),
    defineField({
      name: 'isNew',
      title: 'New arrival',
      type: 'boolean',
      group: 'discoverability',
      initialValue: false,
    }),
    defineField({
      name: 'bestsellerRank',
      title: 'Bestseller rank',
      description: 'Lower ranks surface first. Leave empty if not a bestseller.',
      type: 'number',
      group: 'discoverability',
    }),
    defineField({
      name: 'recommended',
      title: 'Recommended products',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'reference', to: [{type: 'product'}]})],
    }),
    defineField({
      name: 'coPurchase',
      title: 'Frequently bought together',
      type: 'array',
      group: 'discoverability',
      of: [defineArrayMember({type: 'reference', to: [{type: 'product'}]})],
    }),

    /* ---------------- SEO ---------------- */
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({name: 'metaTitle', title: 'Meta title', type: 'string', validation: (rule) => rule.max(60)}),
        defineField({
          name: 'metaDescription',
          title: 'Meta description',
          type: 'text',
          rows: 2,
          validation: (rule) => rule.max(160),
        }),
        defineField({
          name: 'ogImage',
          title: 'Open Graph image',
          type: 'image',
          description: 'Falls back to the main image if empty.',
          options: {hotspot: true},
        }),
      ],
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'nameEn',
      media: 'mainImage',
      brandName: 'brand.name',
      price: 'price',
      currency: 'currency',
    },
    prepare({title, subtitle, media, brandName, price, currency}) {
      return {
        title: title || subtitle || 'Untitled product',
        subtitle: [brandName, price != null ? `${price} ${currency ?? 'KWD'}` : null].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
