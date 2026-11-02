import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '@/sanity/env'

/**
 * Shared Sanity client for the storefront.
 *
 * `useCdn: true` gives fast, cached reads of published content. Live Content
 * (see `live.ts) layers real-time updates and Visual Editing on top of this.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})
