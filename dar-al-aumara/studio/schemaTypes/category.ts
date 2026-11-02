import {defineField, defineType} from 'sanity'

/**
 * Category — shared taxonomy section (e.g. "عطور رجالية"). Products reference
 * categories so a section can be filtered and re-titled in one place.
 */
export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (Arabic)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titleEn',
      title: 'Title (English)',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'titleEn'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      description: 'Id from the previous CATEGORIES array (e.g. men). Migration only.',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent colour',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      description: 'Lower numbers appear first in the storefront nav.',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'titleEn'},
  },
})
