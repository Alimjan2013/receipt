'use client'

import { useState } from 'react'
import { encode } from '@jsquash/avif'

interface ImageConverterProps {
  onImageConverted: (avifBlob: Blob, originalFile: File) => void
}

export default function ImageConverter({ onImageConverted }: ImageConverterProps) {
  const [isConverting, setIsConverting] = useState(false)

  const convertToAvif = async (file: File): Promise<Blob> => {
    const img = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(img, 0, 0)
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)

    if (!imageData) {
      throw new Error('Failed to get image data')
    }

    const avifBuffer = await encode(imageData, {
      cqLevel: 45,
      cqAlphaLevel: 45,
      denoiseLevel: 20,
      tileRowsLog2: 0,
      tileColsLog2: 0,
      speed: 8,
      subsample: 2,
      chromaDeltaQ: false,
      sharpness: 0,
    })

    return new Blob([avifBuffer], { type: 'image/avif' })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setIsConverting(true)
      try {
        const avifBlob = await convertToAvif(file)
        onImageConverted(avifBlob, file)
      } catch (error) {
        console.error('Error converting image:', error)
      } finally {
        setIsConverting(false)
      }
    }
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      disabled={isConverting}
    />
  )
}