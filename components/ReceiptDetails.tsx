'use client'

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import NotionCredentialsDialog from "./NotionCredentialsDialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface Item {
  item: string
  price_eur: number
}

interface ResponseMessage {
  date: string
  items: Item[]
}

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
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [localResponseMessage, setLocalResponseMessage] = useState(responseMessage)
  const [selectedItems, setSelectedItems] = useState(responseMessage.items.map(() => true))
  const [date, setDate] = useState<Date | undefined>(new Date(localResponseMessage.date))

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      setLocalResponseMessage(prev => ({
        ...prev,
        date: newDate.toLocaleDateString('en-CA') // Use 'en-CA' to get YYYY-MM-DD format
      }))
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
          table: { ...localResponseMessage, items: itemsToUpload },
          auth: { token: token, database_id: database_id },
        }),
      })
      const data = await response.json()
      console.log(data)
      toast.success("Upload successful", {
        description: "The selected receipt data has been uploaded to Notion.",
      })
    } catch (error) {
      console.error("Error uploading to Notion:", error)
      toast.error("Upload failed", {
        description: "There was an error uploading the data to Notion.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const toggleSelectAll = () => {
    setSelectedItems(prev => prev.map(() => !prev.every(Boolean)))
  }

  const toggleItemSelection = (index: number) => {
    setSelectedItems(prev => prev.map((item, i) => i === index ? !item : item))
  }

  const handleItemChange = (index: number, field: 'item' | 'price_eur', value: string) => {
    setLocalResponseMessage(prev => {
      const newItems = [...prev.items]
      if (field === 'item') {
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

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Receipt Details</CardTitle>
      </CardHeader>
      <CardContent>
        <NotionCredentialsDialog
          token={token}
          database_id={database_id}
          setToken={setToken}
          setDatabase_id={setDatabase_id}
          showCredentialsDialog={showCredentialsDialog}
          setShowCredentialsDialog={setShowCredentialsDialog}
        />
        <Button
          className="w-full mb-4"
          onClick={handleUploadNotion}
          disabled={!token || !database_id || isUploading}
        >
          {isUploading ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Upload to Notion"
          )}
        </Button>
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm font-medium">Date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedItems.every(Boolean)}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Price (EUR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localResponseMessage.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems[index]}
                    onCheckedChange={() => toggleItemSelection(index)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.item}
                    onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                    className="w-full px-0 py-0 border-0"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={item.price_eur.toFixed(2)}
                    onChange={(e) => handleItemChange(index, 'price_eur', e.target.value)}
                    className="w-full text-right px-0 py-0 border-0"
                    step="0.01"
                    min="0"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}