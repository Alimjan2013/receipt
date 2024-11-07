"use client";
import { createWorker } from 'tesseract.js';
import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleButtonClick = async () => {
    if (image) {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(image);
      setText(ret.data.text);
      console.log(ret.data.text);
      await worker.terminate();
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={handleButtonClick}>Upload and Recognize</button>
      <div>
        {text}
      </div>
    </div>
  );
}
