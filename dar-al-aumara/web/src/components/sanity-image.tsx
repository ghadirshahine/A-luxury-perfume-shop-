import Image from 'next/image'
import {urlFor} from '@/sanity/lib/image'

type AssetMeta = {
  lqip?: string
  dimensions?: {width: number; height: number}
}

export type SanityImageValue = {
  alt?: string
  asset?: {_id?: string; url?: string; metadata?: AssetMeta}
  hotspot?: unknown
  crop?: unknown
}

type SanityImageProps = {
  value?: SanityImageValue
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

/**
 * Renders a Sanity image field through `next/image`, honouring hotspot/crop and
 * the LQIP blur placeholder when the query requested `asset.metadata.lqip`.
 */
export function SanityImage({value, width = 800, height, className, priority}: SanityImageProps) {
  const image = value as SanityImageValue | undefined
  if (!image?.asset) return null

  const alt = image.alt || ''
  const targetHeight = height ?? Math.round(width / 1.5)
  const lqip = image.asset.metadata?.lqip

  return (
    <Image
      className={className}
      src={urlFor(image).width(width).height(targetHeight).fit('crop').url()}
      alt={alt}
      width={width}
      height={targetHeight}
      priority={priority}
      placeholder={lqip ? 'blur' : 'empty'}
      blurDataURL={lqip}
    />
  )
}
