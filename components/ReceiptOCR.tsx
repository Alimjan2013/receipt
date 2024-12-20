import { useState, SetStateAction } from "react";
import { createWorker } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { ResponseMessage,Item } from "@/lib/type";

export default function ReceiptOCR({
  setResponseMessage,
}: {
  setResponseMessage: React.Dispatch<SetStateAction<ResponseMessage | null>>;
}) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleButtonClick = async () => {
    if (image) {
      setIsLoading(true);
      try {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(image);
        const recognizedText = ret.data.text;

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
        const isValidDate = (dateString: string | Date) => {
          const date = new Date(dateString);
          return !isNaN(date.getTime());
        };
        const today = new Date(); // Get today's date in YYYY-MM-DD format

        jsonObject.date = isValidDate(jsonObject.date)
          ? jsonObject.date
          : today;
        jsonObject.items = jsonObject.items.map((item: Item) => ({
          ...item,
          date: isValidDate(jsonObject.date)
          ? jsonObject.date
          : today,
        }));

        setResponseMessage(jsonObject);
        await worker.terminate();
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Processing failed", {
          description: "There was an error processing the image.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="md:mb-0 mb-8 col-span-4 ">
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
  );
}
