/**
 * Public, build-time Sanity configuration.
 *
 * Only NEXT_PUBLIC_* values live here so this module is safe to import from
 * client components. Secrets (read/write tokens) are kept in `token.ts`, which
 * is imported only from server-only code paths.
 */
export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET',
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID',
)

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-01'

export const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3333'

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }
  return v
}
