"use client";

import { useState, useEffect } from "react";
import { createWorker } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { toast, Toaster } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Item {
  item: string;
  price_eur: number;
}

interface ResponseMessage {
  date: string;
  items: Item[];
}

export default function Component() {
  const [text, setText] = useState("");
  const [token, setToken] = useState("");
  const [database_id, setDatabase_id] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<ResponseMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedDatabaseId = localStorage.getItem("database_id");
    if (savedToken) setToken(savedToken);
    if (savedDatabaseId) setDatabase_id(savedDatabaseId);
    if (!savedToken || !savedDatabaseId) {
      setShowCredentialsDialog(true);
    }
  }, []);

  const handleSaveCredentials = () => {
    localStorage.setItem("token", token);
    localStorage.setItem("database_id", database_id);
    setShowCredentialsDialog(false);
    toast.success('Credentials saved', {
      description: 'Your Notion credentials have been saved.',
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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
      toast.success('Upload successful', {
        description: 'The receipt data has been uploaded to Notion.',
      });
    } catch (error) {
      console.error("Error uploading to Notion:", error);
      toast.error('Upload failed', {
        description: 'There was an error uploading the data to Notion.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = async () => {
    if (image) {
      setIsLoading(true);
      try {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(image);
        const recognizedText = ret.data.text;
        setText(recognizedText);
        console.log(recognizedText);
        console.log("sending request with " + text);

        await worker.terminate();
        const response = await fetch("/api/createReceiptTable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: recognizedText }),
        });

        const data = await response.json();
        const jsonString = data.replace(/```json|```/g, "").trim();
        const jsonObject = JSON.parse(jsonString);
        setResponseMessage(jsonObject);
        console.log(jsonObject);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error('Processing failed', {
          description: 'There was an error processing the image.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Receipt OCR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex-grow"
            />
          </div>
          
          <Button
            className="w-full"
            onClick={handleButtonClick}
            disabled={!image || isLoading}
          >
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
            <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
              <DialogTrigger asChild>
                <Button className="w-full mb-4">
                  {token && database_id ? "Update Notion Credentials" : "Set Notion Credentials"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notion Credentials</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    type="text"
                    placeholder="Enter Notion Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Enter Database ID"
                    value={database_id}
                    onChange={(e) => setDatabase_id(e.target.value)}
                  />
                  <Button onClick={handleSaveCredentials} className="w-full">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
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
              Date: {responseMessage.date}
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
      )}

      <div className="mt-8 text-center">
        <Button variant="ghost" className="text-sm">
          Made with{" "}
          <HeartIcon className="inline-block h-4 w-4 text-red-500 mx-1" /> from
          Ali
        </Button>
      </div>
      <Toaster />
    </div>
  );
}