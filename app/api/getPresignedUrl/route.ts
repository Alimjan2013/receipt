import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const originalFilename = searchParams.get('filename');
  const contentType = searchParams.get('contentType');

  if (!originalFilename || !contentType) {
    return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
  }

  try {
    const now = new Date();
    const directoryName = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Math.floor(now.getTime() / 1000);
    const fileExtension = originalFilename.split('.').pop();
    const newFilename = `${timestamp}_${originalFilename.split('.')[0]}.${fileExtension}`;
    const fullPath = `receipts/${directoryName}/${newFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fullPath,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600,
      signableHeaders: new Set(['host', 'content-type']),
    });

    return NextResponse.json({ 
      presignedUrl, 
      publicUrl: `https://${process.env.R2_PUBLIC_DOMAIN}/${fullPath}`,
      fullPath,
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({ error: 'Failed to generate pre-signed URL' }, { status: 500 });
  }
}