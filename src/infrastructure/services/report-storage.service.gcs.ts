import "server-only";
import { admin } from "@/src/infrastructure/firebase/firebase.admin";
import type { IReportStorageService } from "@/src/application/services/report-storage.service.interface";

export class GcsReportStorageService implements IReportStorageService {
    async getSignedUrl(objectName: string): Promise<string> {
        const bucketName = process.env.GCS_BUCKET;
        if (!bucketName) throw new Error("Missing GCS_BUCKET in env");

        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(objectName);

        const [exists] = await file.exists();
        if (!exists) {
            throw new Error(`File not found: ${objectName}`);
        }

        const [url] = await file.getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + 15 * 60_000, // 15 minutes
        });

        return url;
    }

    async readCleanReport(objectName: string): Promise<{ kind: "json" | "text"; json?: any; text?: string; }> {
        const bucketName = process.env.GCS_BUCKET;
        if (!bucketName) throw new Error("Missing GCS_BUCKET in env");

        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(objectName);

        const [exists] = await file.exists();
        if (!exists) {
            throw new Error(`Report not found: ${objectName}`);
        }

        const [buffer] = await file.download();
        const text = buffer.toString("utf8");

        try {
            const json = JSON.parse(text);
            return { kind: "json", json };
        } catch {
            return { kind: "text", text };
        }
    }
}
