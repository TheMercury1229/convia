"use client"

import * as React from "react"
import { Image as ImageKitImage, type IKImageProps } from "@imagekit/next"
import { cn } from "@/lib/utils"

export interface CustomIKImageProps extends IKImageProps {
  fallbackSrc?: string
}

export function IKImage({
  className,
  fallbackSrc,
  src,
  alt,
  ...props
}: CustomIKImageProps) {
  const [currentSrc, setCurrentSrc] = React.useState<string>(src)
  const [hasError, setHasError] = React.useState<boolean>(false)

  React.useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
  }, [src])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && !hasError) {
      setHasError(true)
      setCurrentSrc(fallbackSrc)
    }
    props.onError?.(e)
  }

  return (
    <ImageKitImage
      src={currentSrc}
      alt={alt}
      className={cn("transition-opacity duration-300", className)}
      onError={handleError}
      {...props}
    />
  )
}

export { ImageKitImage }
export type { IKImageProps }
