import createImageUrlBuilder from '@sanity/image-url'
import {dataset, projectId} from '@/sanity/env'

const builder = createImageUrlBuilder({projectId, dataset})
type SanityImageSource = Parameters<typeof builder.image>[0]
type ImageBuilder = ReturnType<typeof builder.image>

/**
 * Build a Sanity image URL (resize/crop/hotspot aware). Use inside components
 * that feed `next/image` via the `SanityImage` helper.
 */
export function urlFor(source: SanityImageSource): ImageBuilder {
  return builder.image(source)
}
