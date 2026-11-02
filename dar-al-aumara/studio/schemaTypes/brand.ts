import {defineField, defineType} from 'sanity'

/**
 * Brand — reusable house/maison entity. Products reference a brand so its
 * name, accent colour and description update everywhere from one place.
 */
export const brand = defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name (Arabic)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'nameEn',
      title: 'Name (English)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'nameEn'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      description: 'Key from the previous BRANDS dictionary (e.g. umara). Migration only.',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent colour',
      type: 'string',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'nameEn', media: 'logo'},
  },
})
