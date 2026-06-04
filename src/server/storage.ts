import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

const s3 = new S3Client({
  endpoint: process.env.REELMOTION_ENDPOINT!,
  region: process.env.REELMOTION_DEFAULT_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.REELMOTION_ACCESS_KEY_ID!,
    secretAccessKey: process.env.REELMOTION_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.REELMOTION_BUCKET_NAME!;

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = "images"
): Promise<string> {
  const ext = path.extname(originalName);
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function getPublicUrl(key: string): string {
  return `${process.env.STORAGE_PUBLIC_URL}/${key}`;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}
