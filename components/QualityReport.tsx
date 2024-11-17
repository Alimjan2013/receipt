'use client'

import { useState, useRef } from 'react'
import { encode } from '@jsquash/avif'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ThumbsDown, Loader2 } from 'lucide-react'
import { Label } from "@/components/ui/label"



export default function QualityReport() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isDataCollectionChecked, setIsDataCollectionChecked] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [blob, setBlob] = useState<{ url: string } | null>(null)
  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const convertToAvif = async (file: File): Promise<ArrayBuffer> => {
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

    return encode(imageData, {
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
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }

    setIsUploading(true)

    try {
      const avifBuffer = await convertToAvif(selectedFile)
      const avifBlob = new Blob([avifBuffer], { type: 'image/avif' })
      const filename = `${selectedFile.name.split('.')[0]}.avif`

      // Get pre-signed URL
      const presignedUrlResponse = await fetch(`/api/getPresignedUrl?filename=${encodeURIComponent(filename)}&contentType=image/avif`)
      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get pre-signed URL')
      }
      const { presignedUrl, publicUrl, fullPath } = await presignedUrlResponse.json()

      // Upload directly to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: avifBlob,
        headers: {
          'Content-Type': 'image/avif',
        },
        mode: 'cors',
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      setBlob({ url: publicUrl })
      console.log('File uploaded successfully. Full path:', fullPath)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!isDataCollectionChecked) {
      alert("Please agree to data collection before submitting.")
      return
    }

    if (!blob) {
      alert('Please upload an image first')
      return
    }

    setIsSavingFeedback(true)

    try {
      // Simulate fake data for OCR result and processed data
      const fakeOcrResult = {
        text: 'Sample OCR text',
        confidence: 0.95
      }

      const fakeProcessedData = {
        items: [
          { name: 'Item 1', price: 10.99 },
          { name: 'Item 2', price: 15.99 }
        ],
        total: 26.98
      }

      const response = await fetch('/api/saveFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: blob.url,
          ocr_result: fakeOcrResult,
          processed_data: fakeProcessedData,
          user_comment: comment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save feedback')
      }

      alert('Feedback saved successfully')
      setComment('')
      setBlob(null)
      setSelectedFile(null)
      setIsDataCollectionChecked(false)
      setIsPopoverOpen(false)
    } catch (error) {
      console.error('Error saving feedback:', error)
      alert('Failed to save feedback')
    } finally {
      setIsSavingFeedback(false)
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" >
        <ThumbsDown className=" h-4 w-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-80">
      <div className="space-y-4">
        <h3 className="font-medium">Thank you for helping improve quality!</h3>
        <Textarea
          placeholder="Enter your comment here"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div>
          <Label htmlFor="file-upload">Upload Picture</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            ref={inputFileRef}
            className="mt-1"
          />
        </div>
        {selectedFile && (
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        )}
        {blob && <p className="text-sm text-green-600">Image uploaded successfully!</p>}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dataCollection"
            checked={isDataCollectionChecked}
            onCheckedChange={(checked) => setIsDataCollectionChecked(checked as boolean)}
          />
          <Label htmlFor="dataCollection" className="text-sm">
            We will be collecting{' '}
            <Dialog>
              <DialogTrigger asChild>
                <span className="text-blue-500 cursor-pointer">some data</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Data Collection Information</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <p>We collect the following data:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Receipt picture</li>
                    <li>Final table items</li>
                    <li>Receipt OCR result</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>
          </Label>
        </div>
        <Button
          onClick={handleSubmitFeedback}
          disabled={!isDataCollectionChecked || !blob || isSavingFeedback}
        >
          {isSavingFeedback ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
    
  )
}