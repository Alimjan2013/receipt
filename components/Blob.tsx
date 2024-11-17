'use client';

import { useState, useRef } from 'react';
import { encode } from '@jsquash/avif';

export default function UploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<{ url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const convertToAvif = async (file: File): Promise<ArrayBuffer> => {
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

    if (!imageData) {
      throw new Error('Failed to get image data');
    }

    return encode(imageData, {
      cqLevel: 45,
      cqAlphaLevel: 45,
      denoiseLevel: 20,
      tileRowsLog2: 0,
      tileColsLog2: 0,
      speed: 8,
      subsample: 2,
      chromaDeltaQ: false,
      sharpness: 0,
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUploading(true);

    try {
      if (!inputFileRef.current?.files) {
        throw new Error('No file selected');
      }

      const file = inputFileRef.current.files[0];
      const avifBuffer = await convertToAvif(file);
      const avifBlob = new Blob([avifBuffer], { type: 'image/avif' });
      const filename = `${file.name.split('.')[0]}.avif`;

      // Get pre-signed URL
      const presignedUrlResponse = await fetch(`/api/getPresignedUrl?filename=${encodeURIComponent(filename)}&contentType=image/avif`);
      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get pre-signed URL');
      }
      const { presignedUrl, publicUrl, fullPath } = await presignedUrlResponse.json();

      // Upload directly to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: avifBlob,
        headers: {
          'Content-Type': 'image/avif',
        },
        mode: 'cors',
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setBlob({ url: publicUrl });
      console.log('File uploaded successfully. Full path:', fullPath);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <h1>Upload Your Receipt</h1>

      <form onSubmit={handleSubmit}>
        <input name="file" ref={inputFileRef} type="file" accept="image/*" required />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  );
}