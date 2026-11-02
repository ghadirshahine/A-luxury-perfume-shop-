import {defineEnableDraftMode} from 'next-sanity/draft-mode'
import {client} from '@/sanity/lib/client'
import {readToken} from '@/sanity/lib/token'

/**
 * Enables Next.js Draft Mode when hit from the Studio's Preview / Presentation
 * button. Studio redirects to `/draft-mode/enable?secret=...&slug=...`; this
 * handler verifies the secret and turns on draft mode so `sanityFetch` starts
 * returning unpublished content and live edits. Only the Studio (authenticated
 * editors) should be able to hit this with a valid secret.
 *
 * The token used here is the server-only read token, never shipped to the
 * browser bundle.
 */
export const {GET} = defineEnableDraftMode({
  client: client.withConfig({token: readToken, useCdn: false}),
})
