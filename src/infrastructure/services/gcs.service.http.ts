// FILE: src/infrastructure/services/gcs.service.ts
import "server-only";
import type {
  IGcsService,
  GcsBucketKey,
  GcsObjectMeta,
  GcsCallOptions,
} from "@/src/application/services/gcs.service.interface";
import { Storage } from "@google-cloud/storage";
import { requireGcsConfig } from "@/src/infrastructure/gcs/gcs.config";

type ServiceAccountJson = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

function isServiceAccountJson(v: unknown): v is ServiceAccountJson {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { client_email?: unknown }).client_email === "string" &&
    typeof (v as { private_key?: unknown }).private_key === "string"
  );
}

function parseServiceAccountJsonFromEnvB64(b64: string) {
  const trimmed = b64.trim();
  const jsonStr = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8").trim();

  const parsed: unknown = JSON.parse(jsonStr);

  if (!isServiceAccountJson(parsed)) {
    throw new Error(
      "GOOGLE_APPLICATION_SA_JSON_B64 JSON missing client_email/private_key"
    );
  }

  const privateKey = parsed.private_key.replace(/\\n/g, "\n");

  return {
    projectId: parsed.project_id,
    credentials: {
      client_email: parsed.client_email,
      private_key: privateKey,
    },
  };
}

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (_storage) return _storage;

  const cfg = requireGcsConfig();

  if (cfg.serviceAccountJsonB64) {
    const { projectId, credentials } = parseServiceAccountJsonFromEnvB64(
      cfg.serviceAccountJsonB64
    );

    _storage = new Storage({ projectId, credentials });
    return _storage;
  }

  _storage = new Storage(); // ADC
  return _storage;
}

function resolveBucketName(_: GcsBucketKey) {
  const cfg = requireGcsConfig();
  return cfg.bucket;
}

function withTimeout<T>(p: Promise<T>, timeoutMs?: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return p;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
      timeoutMs
    );
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

export class HttpGcsService implements IGcsService {
  async listObjects(
    bucket: GcsBucketKey,
    params: { prefix: string; endsWith?: string; maxResults?: number },
    opts?: GcsCallOptions
  ) {
    const storage = getStorage();
    const bucketName = resolveBucketName(bucket);

    const task = storage.bucket(bucketName).getFiles({
      prefix: params.prefix,
      autoPaginate: true,
      maxResults: params.maxResults ?? 200,
    });

    const [files] = await withTimeout(task, opts?.timeoutMs);

    const items: GcsObjectMeta[] = files
      .filter((f) =>
        params.endsWith
          ? f.name.toLowerCase().endsWith(params.endsWith.toLowerCase())
          : true
      )
      .map((f) => ({
        name: f.name,
        size: f.metadata?.size,
        contentType: f.metadata?.contentType,
        updated: f.metadata?.updated,
        md5Hash: f.metadata?.md5Hash,
      }))
      .sort((a, b) =>
        String(b.updated ?? "").localeCompare(String(a.updated ?? ""))
      );

    return { bucketName, items };
  }

  async objectExists(
    bucket: GcsBucketKey,
    objectName: string,
    opts?: GcsCallOptions
  ) {
    const storage = getStorage();
    const bucketName = resolveBucketName(bucket);
    const task = storage.bucket(bucketName).file(objectName).exists();
    const [exists] = await withTimeout(task, opts?.timeoutMs);
    return Boolean(exists);
  }

  async headObject(
    bucket: GcsBucketKey,
    objectName: string,
    opts?: GcsCallOptions
  ) {
    const storage = getStorage();
    const bucketName = resolveBucketName(bucket);
    const file = storage.bucket(bucketName).file(objectName);

    const [exists] = await withTimeout(file.exists(), opts?.timeoutMs);
    if (!exists) return { exists: false as const };

    const [meta] = await withTimeout(file.getMetadata(), opts?.timeoutMs);

    const mapped: GcsObjectMeta = {
      name: objectName,
      size: meta.size,
      contentType: meta.contentType,
      updated: meta.updated,
      md5Hash: meta.md5Hash,
    };

    return { exists: true as const, bucketName, objectName, meta: mapped };
  }

  async createSignedReadUrl(
    bucket: GcsBucketKey,
    params: { objectName: string; expiresMinutes?: number },
    opts?: GcsCallOptions
  ) {
    const storage = getStorage();
    const cfg = requireGcsConfig();
    const bucketName = resolveBucketName(bucket);

    const expiresMinutes = params.expiresMinutes ?? cfg.signedUrlExpiresMin;
    const task = storage
      .bucket(bucketName)
      .file(params.objectName)
      .getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expiresMinutes * 60_000,
      });

    const [url] = await withTimeout(task, opts?.timeoutMs);
    return { url, bucketName, objectName: params.objectName, expiresMinutes };
  }

  async createSignedUploadUrl(
    bucket: GcsBucketKey,
    params: { objectName: string; contentType: string; expiresMinutes?: number },
    opts?: GcsCallOptions
  ) {
    const storage = getStorage();
    const cfg = requireGcsConfig();
    const bucketName = resolveBucketName(bucket);

    const expiresMinutes = params.expiresMinutes ?? cfg.signedUrlExpiresMin;
    const task = storage
      .bucket(bucketName)
      .file(params.objectName)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + expiresMinutes * 60_000,
        contentType: params.contentType,
      });

    const [url] = await withTimeout(task, opts?.timeoutMs);
    return { url, bucketName, objectName: params.objectName };
  }
}