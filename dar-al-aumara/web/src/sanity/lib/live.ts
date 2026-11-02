import {defineLive} from 'next-sanity/live'
import {client} from '@/sanity/lib/client'
import {apiVersion} from '@/sanity/env'
import {readToken} from '@/sanity/lib/token'

/**
 * Live Content API. `sanityFetch` returns published content by default and
 * drafts + real-time updates when Draft Mode / Visual Editing is active.
 * `SanityLive` must be rendered in the root layout to enable live updates.
 *
 * `serverToken` unlocks drafts on the server; `browserToken` streams updates to
 * the client during preview. Both fall back gracefully when unset (published
 * content still works over the CDN).
 */
export const {sanityFetch, SanityLive} = defineLive({
  client: client.withConfig({
    apiVersion,
    // Live content must bypass the CDN when drafts are requested.
    useCdn: false,
  }),
  serverToken: readToken,
  browserToken: readToken,
})
