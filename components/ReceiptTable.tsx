"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus, Edit2 } from 'lucide-react'
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

const HEADER_MAPPINGS_KEY = 'receipt-header-mappings'

export function ReceiptTable() {
  const {
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
  } = useReceiptContext()

  const [editingHeader, setEditingHeader] = useState<keyof typeof headerMapping | null>(null)

  // Load header mappings from local storage on component mount
  useEffect(() => {
    const savedMappings = localStorage.getItem(HEADER_MAPPINGS_KEY)
    if (savedMappings) {
      try {
        const parsedMappings = JSON.parse(savedMappings)
        setHeaderMapping(parsedMappings)
      } catch (error) {
        console.error('Error parsing saved header mappings:', error)
      }
    }
  }, [setHeaderMapping])

  if (!localResponseMessage) {
    return null
  }

  const addNewItem = () => {
    const newItem = {
      item: "",
      price_eur: 0,
      date: date || new Date(),
    }
    setLocalResponseMessage((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
    setSelectedItems((prev) => [...prev, true])
  }

  const handleHeaderEdit = (key: keyof typeof headerMapping) => {
    setEditingHeader(key)
  }

  const handleHeaderChange = (key: keyof typeof headerMapping, value: string) => {
    const newMappings = { ...headerMapping, [key]: value }
    setHeaderMapping(newMappings)
    // Save to local storage whenever headers change
    localStorage.setItem(HEADER_MAPPINGS_KEY, JSON.stringify(newMappings))
  }

  const handleHeaderBlur = () => {
    setEditingHeader(null)
  }

  const renderTableHeader = (key: keyof typeof headerMapping) => {
    if (editingHeader === key) {
      return (
        <Input
          value={headerMapping[key]}
          onChange={(e) => handleHeaderChange(key, e.target.value)}
          onBlur={handleHeaderBlur}
          className="w-full px-2 py-1 text-left font-medium text-sm"
          autoFocus
        />
      )
    }
    return (
      <div className="flex items-center justify-between group">
        <span>{headerMapping[key]}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleHeaderEdit(key)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium">{headerMapping.date}:</span>
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
            <TableHead>{renderTableHeader("item")}</TableHead>
            <TableHead>{renderTableHeader("date")}</TableHead>
            <TableHead className="text-right w-[80px]">{renderTableHeader("price_eur")}</TableHead>
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
            <TableCell colSpan={3}>Selected Total {headerMapping.price_eur}</TableCell>
            <TableCell className="text-right pr-4">
              {localResponseMessage.items
                .filter((item, index) => selectedItems[index])
                .reduce((acc, item) => acc + item.price_eur, 0)
                .toFixed(2)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={4}>
              <Button onClick={addNewItem} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New {headerMapping.item}
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}