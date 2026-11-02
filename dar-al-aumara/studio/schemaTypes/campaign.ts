import {defineField, defineType} from 'sanity'

export const campaign = defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'discount', title: 'Discount'},
    {name: 'banner', title: 'Storefront banner'},
  ],
  fields: [
    defineField({name: 'title', title: 'Campaign name', type: 'string', group: 'basics', validation: (rule) => rule.required()}),
    defineField({
      name: 'kind',
      title: 'Campaign type',
      type: 'string',
      group: 'basics',
      options: {list: [{title: 'Coupon', value: 'coupon'}, {title: 'Offer', value: 'offer'}, {title: 'Banner', value: 'banner'}], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'active', title: 'Active', type: 'boolean', group: 'basics', initialValue: false}),
    defineField({name: 'startsAt', title: 'Starts at', type: 'datetime', group: 'basics'}),
    defineField({name: 'endsAt', title: 'Ends at', type: 'datetime', group: 'basics'}),
    defineField({
      name: 'code',
      title: 'Coupon code',
      type: 'string',
      group: 'discount',
      hidden: ({parent}) => parent?.kind !== 'coupon',
      validation: (rule) => rule.custom(async (value, context) => {
        if ((context.parent as {kind?: string} | undefined)?.kind !== 'coupon' || !value) return true
        const client = context.getClient({apiVersion: '2026-02-01'})
        const id = context.document?._id?.replace(/^drafts\./, '')
        const matches = await client.fetch(
          'count(*[_type == "campaign" && kind == "coupon" && lower(code) == lower($code) && _id != $id])',
          {code: value, id},
        )
        return matches === 0 || 'This coupon code is already in use'
      }),
    }),
    defineField({
      name: 'discountType',
      title: 'Discount type',
      type: 'string',
      group: 'discount',
      options: {list: [{title: 'Percentage', value: 'percent'}, {title: 'Fixed amount', value: 'fixed'}], layout: 'radio'},
      hidden: ({parent}) => parent?.kind === 'banner',
    }),
    defineField({name: 'discountValue', title: 'Discount value', type: 'number', group: 'discount', validation: (rule) => rule.min(0)}),
    defineField({name: 'minimumSubtotal', title: 'Minimum subtotal', type: 'number', group: 'discount', validation: (rule) => rule.min(0)}),
    defineField({name: 'headline', title: 'Headline (Arabic)', type: 'string', group: 'banner'}),
    defineField({name: 'body', title: 'Supporting text', type: 'text', rows: 2, group: 'banner'}),
    defineField({name: 'image', title: 'Banner image', type: 'image', group: 'banner', options: {hotspot: true}, fields: [{name: 'alt', title: 'Alt text', type: 'string'}]}),
    defineField({name: 'buttonText', title: 'Button label', type: 'string', group: 'banner'}),
    defineField({name: 'buttonUrl', title: 'Button URL', type: 'string', group: 'banner'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'kind', active: 'active'},
    prepare: ({title, subtitle, active}) => ({title: title || 'Untitled campaign', subtitle: `${active ? 'Active' : 'Inactive'} · ${subtitle || ''}`}),
  },
})