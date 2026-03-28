// FILE: src/infrastructure/s3/s3.config.ts
import "server-only";

function required(name: string, value?: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

export function requireS3Config() {
  return {
    region: required("AWS_REGION", process.env.AWS_REGION),
    bucket: required("S3_BUCKET", process.env.S3_BUCKET),
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
    signedUrlExpiresMin: Number(process.env.S3_SIGNED_URL_EXPIRES_MIN ?? "15"),
  };
}