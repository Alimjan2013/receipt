import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import NotionCredentialsDialog from "./NotionCredentialsDialog";

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

  const handleUploadNotion = async () => {
    setIsUploading(true);
    try {
      const response = await fetch("/api/uploadToNotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: responseMessage,
          auth: { token: token, database_id: database_id },
        }),
      });
      const data = await response.json();
      console.log(data);
      toast.success("Upload successful", {
        description: "The receipt data has been uploaded to Notion.",
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

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  return (
    <Card>
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
          className="w-full"
          onClick={handleUploadNotion}
          disabled={!token || !database_id || isUploading}
        >
          {isUploading ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Upload to Notion"
          )}
        </Button>
        <p className="mb-4 text-lg font-semibold">
          Date:{" "}
          {isValidDate(responseMessage.date)
            ? responseMessage.date
            : today}
        </p>
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
                <TableCell className="text-right">
                  {item.price_eur.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
