import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";

// Railway Storage (Tigris) injects these variable names when you click "Add to Service"
// Also support REELMOTION_ prefix variants for manual configuration
const ENDPOINT =
  process.env.REELMOTION_ENDPOINT ||
  process.env.AWS_ENDPOINT_URL_S3 ||
  process.env.S3_ENDPOINT ||
  "https://t3.storageapi.dev";

const REGION =
  process.env.REELMOTION_DEFAULT_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  process.env.AWS_REGION ||
  "auto";

const ACCESS_KEY =
  process.env.REELMOTION_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID ||
  "";

const SECRET_KEY =
  process.env.REELMOTION_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY ||
  "";

const BUCKET =
  process.env.REELMOTION_BUCKET_NAME ||
  process.env.BUCKET_NAME ||
  process.env.AWS_BUCKET_NAME ||
  "";

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true,
});

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

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

// Legacy — kept for any remaining callers, but prefer signed URLs
export function getPublicUrl(key: string): string {
  const base = process.env.STORAGE_PUBLIC_URL || `${ENDPOINT}/${BUCKET}`;
  return `${base}/${key}`;
}
