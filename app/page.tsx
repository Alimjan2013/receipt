"use client";
import { createWorker } from "tesseract.js";
import { useState } from "react";

interface Item {
  item: string;
  price_eur: number;
}

interface ResponseMessage {
  date: string;
  items: Item[];
}

export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [responseMessage, setResponseMessage] = useState<ResponseMessage | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleButtonClick = async () => {
    if (image) {
      const worker = await createWorker("eng");
      const ret = await worker.recognize(image);
      const recognizedText = ret.data.text;
      setText(recognizedText);
      console.log(recognizedText);
      

      await worker.terminate();
      const response = await fetch("/api/createReceiptTable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      const data = await response.json();
      const jsonString = data.replace(/```json|```/g, '').trim();
      const jsonObject = JSON.parse(jsonString);
      setResponseMessage(jsonObject);
      console.log(jsonObject);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={handleButtonClick}>Upload and Recognize</button>
      <div>
        {responseMessage && (
        <div>
          <h3>Date: {responseMessage.date}</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price (EUR)</th>
              </tr>
            </thead>
            <tbody>
              {responseMessage.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.item}</td>
                  <td>{item.price_eur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
