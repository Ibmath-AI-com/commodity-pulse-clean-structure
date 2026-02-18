// FILE: src/application/services/gcs.service.interface.ts

export type GcsBucketKey = "active" | "archive";

export type GcsObjectMeta = {
  name: string;
  size?: string | number;
  contentType?: string;
  updated?: string;
  md5Hash?: string;
};

export type GcsCallOptions = {
  timeoutMs?: number;
};

export interface IGcsService {
  listObjects(
    bucket: GcsBucketKey,
    params: { prefix: string; endsWith?: string; maxResults?: number },
    opts?: GcsCallOptions
  ): Promise<{ bucketName: string; items: GcsObjectMeta[] }>;

  objectExists(
    bucket: GcsBucketKey,
    objectName: string,
    opts?: GcsCallOptions
  ): Promise<boolean>;

  headObject(
    bucket: GcsBucketKey,
    objectName: string,
    opts?: GcsCallOptions
  ): Promise<
    | { exists: false }
    | { exists: true; bucketName: string; objectName: string; meta: GcsObjectMeta }
  >;

  createSignedReadUrl(
    bucket: GcsBucketKey,
    params: { objectName: string; expiresMinutes?: number },
    opts?: GcsCallOptions
  ): Promise<{ url: string; bucketName: string; objectName: string; expiresMinutes: number }>;

  createSignedUploadUrl(
    bucket: GcsBucketKey,
    params: { objectName: string; contentType: string; expiresMinutes?: number },
    opts?: GcsCallOptions
  ): Promise<{ url: string; bucketName: string; objectName: string }>;
}
