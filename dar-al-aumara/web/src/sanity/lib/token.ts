/**
 * Server-only access to the Sanity read token.
 *
 * This module reads an unprefixed (secret) env var, so it must only be imported
 * from server code: route handlers, server actions, and `live.ts`. Importing it
 * from a client component would either fail the build or leak the token.
 */
export const readToken = process.env.SANITY_API_READ_TOKEN

/**
 * Server-only write token used by the checkout server action to create `order`
 * documents. Scope it in Sanity → API → Tokens to the minimum needed (create
 * orders) so a leaked action cannot mutate the whole dataset.
 */
export const writeToken = process.env.SANITY_API_WRITE_TOKEN

if (!readToken && process.env.NODE_ENV === 'production') {
  // Fail loudly rather than silently serving stale/unauthorized data.
  throw new Error('Missing environment variable: SANITY_API_READ_TOKEN')
}
