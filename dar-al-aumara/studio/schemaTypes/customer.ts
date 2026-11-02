import {defineField, defineType} from 'sanity'

export const customer = defineType({
  name: 'customer',
  title: 'Customer',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'phone', title: 'Phone', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'city', title: 'City', type: 'string'}),
    defineField({name: 'address', title: 'Address', type: 'text', rows: 2}),
    defineField({name: 'orderCount', title: 'Orders', type: 'number', readOnly: true, initialValue: 0}),
    defineField({name: 'firstOrderAt', title: 'First order', type: 'datetime', readOnly: true}),
    defineField({name: 'lastOrderAt', title: 'Latest order', type: 'datetime', readOnly: true}),
  ],
  preview: {select: {title: 'name', subtitle: 'phone'}},
})