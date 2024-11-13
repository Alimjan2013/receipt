import React from "react"
import { ResponseMessage } from "@/lib/type"

export interface ReceiptContextType {
  localResponseMessage: ResponseMessage
  selectedItems: boolean[]
  date: Date | undefined
  isItemDateChanged: boolean
  handleDateChange: (newDate: Date | undefined) => void
  toggleSelectAll: () => void
  toggleItemSelection: (index: number) => void
  handleItemChange: (index: number, field: "item" | "price_eur", value: string) => void
  setLocalResponseMessage: React.Dispatch<React.SetStateAction<ResponseMessage>>
  setIsItemDateChanged: React.Dispatch<React.SetStateAction<boolean>>
}

export const ReceiptContext = React.createContext<ReceiptContextType | undefined>(undefined)

export function useReceiptContext() {
  const context = React.useContext(ReceiptContext)
  if (context === undefined) {
    throw new Error("useReceiptContext must be used within a ReceiptContextProvider")
  }
  return context
}