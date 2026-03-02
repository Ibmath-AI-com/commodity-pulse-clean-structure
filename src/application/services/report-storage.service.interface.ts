export interface IReportStorageService {
    /**
     * Generates a signed URL to read a file from the underlying storage.
     */
    getSignedUrl(objectName: string): Promise<string>;

    /**
     * Reads a clean report JSON from storage and parses it, or returns text if not JSON.
     */
    readCleanReport(objectName: string): Promise<{ kind: "json" | "text", json?: any, text?: string }>;
}
