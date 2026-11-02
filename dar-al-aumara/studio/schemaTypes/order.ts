import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Order — a storefront purchase. The checkout server action creates these in
 * Sanity (server-side, using a scoped write token) after validating each line
 * against the product's live `stock`. Editors fulfil and update status here in
 * Studio, which is why the admin surface is the Studio rather than admin.js.
 */
export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  fields: [
    defineField({
      name: 'orderNumber',
      title: 'Order number',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: ['new', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        layout: 'radio',
      },
      initialValue: 'new',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'customer',
      title: 'Customer',
      type: 'object',
      fields: [
        defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'phone', title: 'Phone', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'email', title: 'Email', type: 'string'}),
        defineField({name: 'city', title: 'City', type: 'string'}),
        defineField({name: 'address', title: 'Address', type: 'text', rows: 2}),
      ],
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'orderLine',
          title: 'Line',
          type: 'object',
          fields: [
            defineField({name: 'product', title: 'Product', type: 'reference', to: [{type: 'product'}]}),
            defineField({name: 'nameSnapshot', title: 'Product name', type: 'string'}),
            defineField({name: 'ml', title: 'Size (ml)', type: 'number'}),
            defineField({name: 'qty', title: 'Quantity', type: 'number', validation: (rule) => rule.required().min(1)}),
            defineField({name: 'unitPrice', title: 'Unit price', type: 'number', validation: (rule) => rule.required().min(0)}),
            defineField({name: 'lineTotal', title: 'Line total', type: 'number'}),
          ],
          preview: {
            select: {name: 'nameSnapshot', ml: 'ml', qty: 'qty'},
            prepare: ({name, ml, qty}) => ({title: name || 'Item', subtitle: `${ml ?? '-'} ml · x${qty ?? 1}`}),
          },
        }),
        defineField({name: 'customerRecord', title: 'Customer record', type: 'reference', to: [{type: 'customer'}]}),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'pricing',
      title: 'Pricing',
      type: 'object',
      fields: [
        defineField({name: 'subtotal', title: 'Subtotal', type: 'number', validation: (rule) => rule.required()}),
        defineField({name: 'discount', title: 'Discount', type: 'number', initialValue: 0}),
        defineField({name: 'shipping', title: 'Shipping', type: 'number', initialValue: 0}),
        defineField({name: 'packaging', title: 'Packaging', type: 'number', initialValue: 0}),
        defineField({name: 'total', title: 'Total', type: 'number', validation: (rule) => rule.required()}),
        defineField({name: 'currency', title: 'Currency', type: 'string', initialValue: 'KWD'}),
      ],
    }),
    defineField({
      name: 'paymentMethod',
      title: 'Payment method',
      type: 'string',
      options: {list: ['knet', 'card', 'applepay', 'paypal', 'cod']},
    }),
    defineField({
      name: 'couponCode',
      title: 'Coupon code',
      type: 'string',
    }),
    defineField({
      name: 'placedAt',
      title: 'Placed at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {title: 'orderNumber', subtitle: 'status'},
    prepare: ({title, subtitle}) => ({title: `Order ${title || ''}`, subtitle}),
  },
})
