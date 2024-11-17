"use client"

import React, { useState, useEffect } from "react"
import { Loader2Icon, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import NotionCredentialsDialog from "./NotionCredentialsDialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResponseMessage } from "@/lib/type"
import { ReceiptTable } from "./ReceiptTable"
import { ReceiptContext, ReceiptContextType, HeaderMapping } from "./ReceiptContext"
import QualityReport from "./QualityReport"

interface ReceiptDetailsProps {
  responseMessage: ResponseMessage
  token: string
  database_id: string
  setToken: (token: string) => void
  setDatabase_id: (database_id: string) => void
}

export default function ReceiptDetails({
  responseMessage,
  token,
  database_id,
  setToken,
  setDatabase_id,
}: ReceiptDetailsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isItemDateChanged, setIsItemDateChanged] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [localResponseMessage, setLocalResponseMessage] = useState(responseMessage)
  const [selectedItems, setSelectedItems] = useState(responseMessage.items.map(() => true))
  const [date, setDate] = useState<Date | undefined>(new Date(localResponseMessage.date))
  const [headerMapping, setHeaderMapping] = useState<HeaderMapping>({
    item: "Item",
    price_eur: "Price (EUR)",
    date: "Date",
  })

  useEffect(() => {
    setLocalResponseMessage(responseMessage)
    setSelectedItems(responseMessage.items.map(() => true))
    setDate(new Date(responseMessage.date))
  }, [responseMessage])

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      setLocalResponseMessage((prev) => ({
        ...prev,
        date: newDate,
        items: prev.items.map((item) => ({
          ...item,
          date: newDate,
        })),
      }))
      setIsItemDateChanged(false)
    }
  }

  const handleUploadNotion = async () => {
    setIsUploading(true)
    try {
      const itemsToUpload = localResponseMessage.items.filter((_, index) => selectedItems[index])
      
      const response = await fetch("/api/uploadToNotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToUpload,
          auth: { token, database_id },
          headerMapping,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload to Notion")
      }

      toast.success("Upload successful", {
        description: "The selected receipt data has been uploaded to Notion.",
      })
    } catch (error) {
      console.error("Error uploading to Notion:", error)
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "There was an error uploading the data to Notion.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSelectAll = () => {
    setSelectedItems((prev) => prev.map(() => !prev.every(Boolean)))
  }

  const toggleItemSelection = (index: number) => {
    setSelectedItems((prev) => prev.map((item, i) => (i === index ? !item : item)))
  }

  const handleItemChange = (index: number, field: "item" | "price_eur", value: string) => {
    setLocalResponseMessage((prev) => {
      const newItems = [...prev.items]
      if (field === "item") {
        newItems[index] = { ...newItems[index], item: value }
      } else {
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          newItems[index] = { ...newItems[index], price_eur: numValue }
        }
      }
      return { ...prev, items: newItems }
    })
  }

  const contextValue: ReceiptContextType = {
    localResponseMessage,
    selectedItems,
    date,
    isItemDateChanged,
    headerMapping,
    handleDateChange,
    toggleSelectAll,
    toggleItemSelection,
    handleItemChange,
    setLocalResponseMessage,
    setIsItemDateChanged,
    setSelectedItems,
    setHeaderMapping,
  }

  return (
    <ReceiptContext.Provider value={contextValue}>
      <Card className="w-full max-w-3xl col-span-6">
        <CardHeader>
          <CardTitle>
            <div className="w-full flex justify-between items-center">
              <p>Receipt Details</p>
              <div>
              <QualityReport />
              <NotionCredentialsDialog
                token={token}
                database_id={database_id}
                setToken={setToken}
                setDatabase_id={setDatabase_id}
                showCredentialsDialog={showCredentialsDialog}
                setShowCredentialsDialog={setShowCredentialsDialog}
              />
              </div>
            

            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full mb-4"
            onClick={handleUploadNotion}
            disabled={
              !token || !database_id || isUploading || selectedItems.every((item) => !item)
            }
          >
            {isUploading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Upload to Notion"
            )}
          </Button>
          {(!token || !database_id) && (
            <Alert variant="default" className="mb-4 p-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between w-full">
                <span>Connect your Notion account to save receipts.</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => setShowCredentialsDialog(true)}
                >
                  Connect Notion
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <ReceiptTable />
        </CardContent>
      </Card>
    </ReceiptContext.Provider>
  )
}