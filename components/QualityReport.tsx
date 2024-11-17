'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ThumbsDown, Loader2 } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { ResponseMessage } from "@/lib/type"
import { toast } from "sonner"


interface QualityReportProps {
  responseMessage: ResponseMessage
}

export default function Component({ responseMessage }: QualityReportProps = { responseMessage: {} as ResponseMessage }) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isDataCollectionChecked, setIsDataCollectionChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitFeedback = async () => {
    if (!isDataCollectionChecked) {
        toast.error("Please agree to data collection before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload image to server and get URL
      const avifImageUrl = localStorage.getItem('avifImage')
      if (!avifImageUrl) {
        throw new Error('No receipt image found. Please try processing the receipt again.')
      }

      const response = await fetch(avifImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'receipt.avif', { type: 'image/avif' })

      const avifBlob = new Blob([file], { type: 'image/avif' })
      const filename = `receipt_${Date.now()}.avif`

      // Get pre-signed URL
      const presignedUrlResponse = await fetch(`/api/getPresignedUrl?filename=${encodeURIComponent(filename)}&contentType=image/avif`)
      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get pre-signed URL')
      }
      const { presignedUrl, publicUrl } = await presignedUrlResponse.json()

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

      // 2. Upload other data together to database
      const feedbackResponse = await fetch('/api/saveFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: publicUrl,
          ocr_result: responseMessage,
          processed_data: responseMessage,
          user_comment: comment,
        }),
      })

      if (!feedbackResponse.ok) {
        throw new Error('Failed to save feedback')
      }

      toast.success('Feedback saved successfully')
      setComment('')
      setIsDataCollectionChecked(false)
      setIsPopoverOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          <ThumbsDown className="h-4 w-4" />
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
            disabled={!isDataCollectionChecked || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
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