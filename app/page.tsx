"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReceiptDetails from "@/components/ReceiptDetails";
import ReceiptOCR from "@/components/ReceiptOCR";
import { HeartIcon } from "lucide-react";

interface Item {
  item: string;
  price_eur: number;
}

interface ResponseMessage {
  date: string;
  items: Item[];
}

export default function Component() {
  const [token, setToken] = useState("");
  const [database_id, setDatabase_id] = useState("");
  const [responseMessage, setResponseMessage] = useState<ResponseMessage | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedDatabaseId = localStorage.getItem("database_id");
    if (savedToken) setToken(savedToken);
    if (savedDatabaseId) setDatabase_id(savedDatabaseId);
    if (!savedToken || !savedDatabaseId) {
      console.log(showCredentialsDialog);
      setShowCredentialsDialog(true);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="md:grid grid-cols-10 grid-rows-1 gap-2 ">
        <ReceiptOCR setResponseMessage={setResponseMessage} />

        {responseMessage && (
          <ReceiptDetails
            responseMessage={responseMessage}
            token={token}
            database_id={database_id}
            setDatabase_id={setDatabase_id}
            setToken={setToken}
          />
        )}
      </div>

      <div className="mt-8 text-center">
        <Button variant="ghost" className="text-sm">
          Made with{" "}
          <HeartIcon className="inline-block h-4 w-4 text-red-500 mx-1" /> by
          Ali
        </Button>
      </div>
    </div>
  );
}
