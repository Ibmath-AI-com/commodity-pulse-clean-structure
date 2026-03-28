// FILE: src/application/services/storage.service.interface.ts

export type StorageBucketKey  = "active" | "archive";

export type StorageObjectMeta  = {
  name: string;
  size?: string | number;
  contentType?: string;
  updated?: string;
  md5Hash?: string;
};

export type StorageCallOptions = {
  timeoutMs?: number;
};

export interface IObjectStorageService {
  listObjects(
    bucket: StorageBucketKey,
    params: { prefix: string; endsWith?: string; maxResults?: number },
    opts?: StorageCallOptions
  ): Promise<{ bucketName: string; items: StorageObjectMeta[] }>;

  objectExists(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions
  ): Promise<boolean>;

  headObject(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions
  ): Promise<
    | { exists: false }
    | { exists: true; bucketName: string; objectName: string; meta: StorageObjectMeta }
  >;

  createSignedReadUrl(
    bucket: StorageBucketKey,
    params: { objectName: string; expiresMinutes?: number },
    opts?: StorageCallOptions
  ): Promise<{ url: string; bucketName: string; objectName: string; expiresMinutes: number }>;

  createSignedUploadUrl(
    bucket: StorageBucketKey,
    params: { objectName: string; contentType: string; expiresMinutes?: number },
    opts?: StorageCallOptions
  ): Promise<{ url: string; bucketName: string; objectName: string }>;

  readObjectAsText(
    bucket: StorageBucketKey, 
    objectName: string,
    opts?: StorageCallOptions
  ): Promise<string>;

  deleteObject(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions & { ignoreNotFound?: boolean }
  ): Promise<void>;

  getObjectText(
    bucket: StorageBucketKey,
    objectKey: string
  ): Promise<{ bucketName: string; objectKey: string; body: string }>;

  copyObject(
    bucket: StorageBucketKey,
    params: { sourceObjectName: string; destObjectName: string },
    opts?: StorageCallOptions
  ): Promise<void>;

  moveObject(
    bucket: StorageBucketKey,
    params: { sourceObjectName: string; destObjectName: string },
    opts?: StorageCallOptions & { ignoreNotFound?: boolean }
  ): Promise<void>;
}
