import "server-only";

import type {
  IObjectStorageService,
  StorageBucketKey,
  StorageObjectMeta,
  StorageCallOptions,
} from "@/src/application/services/storage.service.interface";

import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireS3Config } from "@/src/infrastructure/s3/s3.config";

import { Readable } from "node:stream";

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_client) return _client;

  const cfg = requireS3Config();

  _client = new S3Client({
    region: cfg.region,
    credentials:
      cfg.accessKeyId && cfg.secretAccessKey
        ? {
            accessKeyId: cfg.accessKeyId,
            secretAccessKey: cfg.secretAccessKey,
          }
        : undefined,
  });

  return _client;
}

function resolveBucketName(_: StorageBucketKey) {
  const cfg = requireS3Config();
  return cfg.bucket;
}

function isReadableStream(value: unknown): value is Readable {
  return value instanceof Readable;
}

async function streamToString(stream: unknown): Promise<string> {
  if (!isReadableStream(stream)) {
    throw new Error("Invalid stream type");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function withTimeout<T>(p: Promise<T>, timeoutMs?: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return p;

  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);

    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

function normalizeS3Error(e: unknown): { code?: number; message: string; name?: string } {
  if (typeof e !== "object" || e === null) {
    return { message: "S3 operation failed" };
  }

  const err = e as {
    $metadata?: { httpStatusCode?: number };
    message?: unknown;
    name?: unknown;
  };

  const code =
    typeof err.$metadata?.httpStatusCode === "number"
      ? err.$metadata.httpStatusCode
      : undefined;

  const message =
    typeof err.message === "string" && err.message.trim()
      ? err.message
      : "S3 operation failed";

  const name = typeof err.name === "string" ? err.name : undefined;

  return { code, message, name };
}

function mapS3ObjectToMeta(obj: {
  Key?: string;
  Size?: number;
  ETag?: string;
  LastModified?: Date;
}): StorageObjectMeta {
  return {
    name: obj.Key ?? "",
    size: obj.Size != null ? String(obj.Size) : undefined,
    contentType: undefined,
    updated: obj.LastModified?.toISOString(),
    md5Hash: obj.ETag?.replace(/"/g, ""),
  };
}

export class S3StorageService implements IObjectStorageService {
  async listObjects(
    bucket: StorageBucketKey,
    params: { prefix: string; endsWith?: string; maxResults?: number },
    opts?: StorageCallOptions
  ) {
    const s3 = getS3Client();
    const bucketName = resolveBucketName(bucket);

    const task = s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: params.prefix,
        MaxKeys: params.maxResults ?? 200,
      })
    );

    const result = await withTimeout(task, opts?.timeoutMs);

    const items: StorageObjectMeta[] = (result.Contents ?? [])
      .filter((o) =>
        params.endsWith
          ? (o.Key ?? "").toLowerCase().endsWith(params.endsWith.toLowerCase())
          : true
      )
      .map(mapS3ObjectToMeta)
      .sort((a, b) => String(b.updated ?? "").localeCompare(String(a.updated ?? "")));

    return { bucketName, items };
  }

  async objectExists(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions
  ) {
    const s3 = getS3Client();
    const bucketName = resolveBucketName(bucket);

    try {
      await withTimeout(
        s3.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectName,
          })
        ),
        opts?.timeoutMs
      );
      return true;
    } catch (e) {
      const { code, name } = normalizeS3Error(e);
      if (code === 404 || name === "NotFound") return false;
      throw e;
    }
  }

  async headObject(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions
  ) {
    const s3 = getS3Client();
    const bucketName = resolveBucketName(bucket);

    try {
      const meta = await withTimeout(
        s3.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: objectName,
          })
        ),
        opts?.timeoutMs
      );

      const mapped: StorageObjectMeta = {
        name: objectName,
        size: meta.ContentLength != null ? String(meta.ContentLength) : undefined,
        contentType: meta.ContentType,
        updated: meta.LastModified?.toISOString(),
        md5Hash: meta.ETag?.replace(/"/g, ""),
      };

      return { exists: true as const, bucketName, objectName, meta: mapped };
    } catch (e) {
      const { code, name } = normalizeS3Error(e);
      if (code === 404 || name === "NotFound") {
        return { exists: false as const };
      }
      throw new Error(`S3 headObject failed: ${normalizeS3Error(e).message}`);
    }
  }

  async createSignedReadUrl(
    bucket: StorageBucketKey,
    params: { objectName: string; expiresMinutes?: number },
    opts?: StorageCallOptions
  ) {
    const s3 = getS3Client();
    const cfg = requireS3Config();
    const bucketName = resolveBucketName(bucket);

    const expiresMinutes = params.expiresMinutes ?? cfg.signedUrlExpiresMin;

    const task = getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: params.objectName,
      }),
      { expiresIn: expiresMinutes * 60 }
    );

    const url = await withTimeout(task, opts?.timeoutMs);

    return {
      url,
      bucketName,
      objectName: params.objectName,
      expiresMinutes,
    };
  }

  async createSignedUploadUrl(
    bucket: StorageBucketKey,
    params: { objectName: string; contentType: string; expiresMinutes?: number },
    opts?: StorageCallOptions
  ) {
    const s3 = getS3Client();
    const cfg = requireS3Config();
    const bucketName = resolveBucketName(bucket);

    const expiresMinutes = params.expiresMinutes ?? cfg.signedUrlExpiresMin;

    const task = getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: params.objectName,
        ContentType: params.contentType,
      }),
      { expiresIn: expiresMinutes * 60 }
    );

    const url = await withTimeout(task, opts?.timeoutMs);

    return {
      url,
      bucketName,
      objectName: params.objectName,
    };
  }

  async deleteObject(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions & { ignoreNotFound?: boolean }
  ): Promise<void> {
    const s3 = getS3Client();
    const bucketName = resolveBucketName(bucket);

    try {
      await withTimeout(
        s3.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: objectName,
          })
        ),
        opts?.timeoutMs
      );
    } catch (e) {
      const { code, name, message } = normalizeS3Error(e);
      if (opts?.ignoreNotFound && (code === 404 || name === "NotFound")) return;
      throw new Error(`S3 deleteObject failed: ${message}`);
    }
  }

  async copyObject(
    bucket: StorageBucketKey,
    params: { sourceObjectName: string; destObjectName: string },
    opts?: StorageCallOptions
  ): Promise<void> {
    const s3 = getS3Client();
    const bucketName = resolveBucketName(bucket);

    try {
      await withTimeout(
        s3.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            Key: params.destObjectName,
            CopySource: `${bucketName}/${params.sourceObjectName}`,
          })
        ),
        opts?.timeoutMs
      );
    } catch (e) {
      const { message } = normalizeS3Error(e);
      throw new Error(`S3 copyObject failed: ${message}`);
    }
  }

  async moveObject(
    bucket: StorageBucketKey,
    params: { sourceObjectName: string; destObjectName: string },
    opts?: StorageCallOptions & { ignoreNotFound?: boolean }
  ): Promise<void> {
    await this.copyObject(
      bucket,
      {
        sourceObjectName: params.sourceObjectName,
        destObjectName: params.destObjectName,
      },
      opts
    );

    await this.deleteObject(bucket, params.sourceObjectName, {
      timeoutMs: opts?.timeoutMs,
      ignoreNotFound: Boolean(opts?.ignoreNotFound),
    });
  }

  async readObjectAsText(
    bucket: StorageBucketKey,
    objectName: string,
    opts?: StorageCallOptions
  ): Promise<string> {
    const s3 = getS3Client();
    const bucketName = resolveBucketName(bucket);

    try {
      const out = await withTimeout(
        s3.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: objectName,
          })
        ),
        opts?.timeoutMs
      );

      if (!out.Body) {
        throw new Error(`Object has no body: ${objectName}`);
      }

      return await streamToString(out.Body as Readable);
    } catch (e) {
      const { message } = normalizeS3Error(e);
      throw new Error(`S3 readObjectAsText failed: ${message}`);
    }
  }

  async getObjectText(
    bucket: StorageBucketKey,
    objectKey: string
  ): Promise<{ bucketName: string; objectKey: string; body: string }> {
    const bucketName = resolveBucketName(bucket);
    const body = await this.readObjectAsText(bucket, objectKey);
    return { bucketName, objectKey, body };
  }
}