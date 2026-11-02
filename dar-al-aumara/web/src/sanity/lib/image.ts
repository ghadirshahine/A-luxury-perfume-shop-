import createImageUrlBuilder from '@sanity/image-url'
import type {ImageBuilder, SanityImageSource} from '@sanity/image-url'
import {dataset, projectId} from '@/sanity/env'

const builder = createImageUrlBuilder({projectId, dataset})

/**
 * Build a Sanity image URL (resize/crop/hotspot aware). Use inside components
 * that feed `next/image` via the `SanityImage` helper.
 */
export function urlFor(source: SanityImageSource): ImageBuilder {
  return builder.image(source)
}
