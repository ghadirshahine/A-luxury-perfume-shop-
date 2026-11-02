import 'server-only'
import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '@/sanity/env'
import {writeToken} from '@/sanity/lib/token'

/**
 * Server-only Sanity client that can WRITE documents (used by the checkout
 * action to create `order` documents and decrement stock). The token is read
 * from an unprefixed secret env var and is never exposed to the browser.
 *
 * If `SANITY_API_WRITE_TOKEN` is missing the client still constructs, but the
 * action will surface a clear error — reads (published content) keep working.
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: writeToken,
  useCdn: false,
  // Orders are transactional; always read your own writes.
  stega: false,
})
