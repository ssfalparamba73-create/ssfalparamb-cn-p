"use client"

import { useEffect, useState } from "react"

interface TransparentLogoProps {
  src: string
  alt: string
  className?: string
}

export function TransparentLogo({ src, alt, className }: TransparentLogoProps) {
  const [dataUrl, setDataUrl] = useState(src)

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.crossOrigin = "Anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        // Remove white or very light pixels (r, g, b > 230)
        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
          data[i + 3] = 0 // Set alpha to 0
        }
      }
      
      ctx.putImageData(imageData, 0, 0)
      setDataUrl(canvas.toDataURL("image/png"))
    }
  }, [src])

  return <img src={dataUrl} alt={alt} className={className} />
}
