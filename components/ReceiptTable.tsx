"use client"

import React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useReceiptContext } from "./ReceiptContext"

export function ReceiptTable() {
  const {
    localResponseMessage,
    selectedItems,
    date,
    isItemDateChanged,
    handleDateChange,
    toggleSelectAll,
    toggleItemSelection,
    handleItemChange,
    setLocalResponseMessage,
    setIsItemDateChanged,
  } = useReceiptContext()

  if (!localResponseMessage) {
    return null
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium">Date:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                isItemDateChanged && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <Checkbox checked={selectedItems.every(Boolean)} onCheckedChange={toggleSelectAll} />
            </TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right w-[80px]">€ Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="w-full">
          {localResponseMessage.items.map((item, index) => (
            <TableRow className="w-full" key={index}>
              <TableCell>
                <Checkbox
                  checked={selectedItems[index]}
                  onCheckedChange={() => toggleItemSelection(index)}
                />
              </TableCell>
              <TableCell>
                <Input
                  value={item.item}
                  onChange={(e) => handleItemChange(index, "item", e.target.value)}
                  className="w-full px-0 py-0 border-0"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  value={format(new Date(item.date), "yyyy-MM-dd")}
                  onChange={(e) => {
                    setLocalResponseMessage((prev) => ({
                      ...prev,
                      items: prev.items.map((item, i) =>
                        i === index ? { ...item, date: new Date(e.target.value) } : item
                      ),
                    }))
                    setIsItemDateChanged(true)
                  }}
                  className="w-full px-0 py-0 border-0"
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  value={item.price_eur.toFixed(2)}
                  onChange={(e) => handleItemChange(index, "price_eur", e.target.value)}
                  className="w-full text-right px-0 py-0 border-0"
                  step="0.01"
                  min="0"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Selected Total Price</TableCell>
            <TableCell className="text-right pr-4">
              {localResponseMessage.items
                .filter((item, index) => selectedItems[index])
                .reduce((acc, item) => acc + item.price_eur, 0)
                .toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}