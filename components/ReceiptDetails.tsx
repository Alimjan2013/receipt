"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2Icon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import NotionCredentialsDialog from "./NotionCredentialsDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Item {
  item: string;
  price_eur: number;
}

interface ResponseMessage {
  date: string;
  items: Item[];
}

interface ReceiptDetailsProps {
  responseMessage: ResponseMessage;
  token: string;
  database_id: string;
  setToken: (token: string) => void;
  setDatabase_id: (database_id: string) => void;
}

export default function ReceiptDetails({
  responseMessage,
  token,
  database_id,
  setToken,
  setDatabase_id,
}: ReceiptDetailsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [localResponseMessage, setLocalResponseMessage] =
    useState(responseMessage);
  const [selectedItems, setSelectedItems] = useState(
    responseMessage.items.map(() => true)
  );
  const [date, setDate] = useState<Date | undefined>(
    new Date(localResponseMessage.date)
  );

  useEffect(() => {
    setLocalResponseMessage(responseMessage);
    setSelectedItems(responseMessage.items.map(() => true));
    setDate(new Date(responseMessage.date));
  }, [responseMessage]);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      setLocalResponseMessage((prev) => ({
        ...prev,
        date: newDate.toLocaleDateString("en-CA"),
      }));
    }
  };

  const handleUploadNotion = async () => {
    setIsUploading(true);
    try {
      const itemsToUpload = localResponseMessage.items.filter(
        (_, index) => selectedItems[index]
      );
      const response = await fetch("/api/uploadToNotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: { ...localResponseMessage, items: itemsToUpload },
          auth: { token: token, database_id: database_id },
        }),
      });
      const data = await response.json();
      console.log(data);
      toast.success("Upload successful", {
        description: "The selected receipt data has been uploaded to Notion.",
      });
    } catch (error) {
      console.error("Error uploading to Notion:", error);
      toast.error("Upload failed", {
        description: "There was an error uploading the data to Notion.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSelectAll = () => {
    setSelectedItems((prev) => prev.map(() => !prev.every(Boolean)));
  };

  const toggleItemSelection = (index: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? !item : item))
    );
  };

  const handleItemChange = (
    index: number,
    field: "item" | "price_eur",
    value: string
  ) => {
    setLocalResponseMessage((prev) => {
      const newItems = [...prev.items];
      if (field === "item") {
        newItems[index] = { ...newItems[index], item: value };
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          newItems[index] = { ...newItems[index], price_eur: numValue };
        }
      }
      return { ...prev, items: newItems };
    });
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>
          <div className="w-full flex justify-between items-center">
            <p>Receipt Details</p>
            <NotionCredentialsDialog
              token={token}
              database_id={database_id}
              setToken={setToken}
              setDatabase_id={setDatabase_id}
              showCredentialsDialog={showCredentialsDialog}
              setShowCredentialsDialog={setShowCredentialsDialog}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full mb-4"
          onClick={handleUploadNotion}
          disabled={
            !token ||
            !database_id ||
            isUploading ||
            selectedItems.every((item) => !item)
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
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedItems.every(Boolean)}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Item</TableHead>
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
                <TableCell >
                  <Input
                    value={item.item}
                    onChange={(e) =>
                      handleItemChange(index, "item", e.target.value)
                    }
                    className="w-full px-0 py-0 border-0"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={item.price_eur.toFixed(2)}
                    onChange={(e) =>
                      handleItemChange(index, "price_eur", e.target.value)
                    }
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
     
              <TableCell colSpan={2}>Selected Total Price</TableCell>
              <TableCell className="text-right pr-4">
                {localResponseMessage.items
                  .filter((item, index) => selectedItems[index])
                  .reduce((acc, item) => acc + item.price_eur, 0)
                  .toFixed(2)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
