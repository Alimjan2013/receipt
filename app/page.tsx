"use client"

import { useState } from "react"
import { createWorker } from "tesseract.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeartIcon, Loader2Icon } from "lucide-react"
import Image from "next/image"

interface Item {
  item: string
  price_eur: number
}

interface ResponseMessage {
  date: string
  items: Item[]
}

export default function Component() {
  const [text, setText] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState<ResponseMessage | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleButtonClick = async () => {
    if (image) {
      setIsLoading(true)
      try {
        const worker = await createWorker("eng")
        const ret = await worker.recognize(image)
        const recognizedText = ret.data.text
        setText(recognizedText)
        console.log(recognizedText)
        console.log("sending request with " + text ) 

        await worker.terminate()
        const response = await fetch("/api/createReceiptTable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: recognizedText }),
        })

        const data = await response.json()
        const jsonString = data.replace(/```json|```/g, "").trim()
        const jsonObject = JSON.parse(jsonString)
        setResponseMessage(jsonObject)
        console.log(jsonObject)
      } catch (error) {
        console.error("Error processing image:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Receipt OCR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="flex-grow" />
          </div>
          <Button className="w-full" onClick={handleButtonClick} disabled={!image || isLoading}>
              {isLoading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Recognize"
              )}
            </Button>
          {imagePreview && (
            <div className="mt-4">
              <Image
                src={imagePreview}
                alt="Receipt preview"
                width={300}
                height={400}
                className="rounded-lg object-contain w-auto"
              />
            </div>
          )}
         
        </CardContent>
      </Card>

      {responseMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-lg font-semibold">Date: {responseMessage.date}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Price (EUR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responseMessage.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.item}</TableCell>
                    <TableCell className="text-right">{item.price_eur.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <Button variant="ghost" className="text-sm">
          Made with <HeartIcon className="inline-block h-4 w-4 text-red-500 mx-1" /> from Ali
        </Button>
      </div>
    </div>
  )
}