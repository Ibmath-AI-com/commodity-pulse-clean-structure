import "server-only";
import { admin } from "@/src/infrastructure/firebase/firebase.admin";
import type { IReportsRepository } from "@/src/application/repositories/reports.repository.interface";
import type { ReportBase, Source } from "@/src/entities/models/report-base";

function fileNameOnly(p: string) {
    return p.replace(/[\\]/g, "/").split("/").pop() || p;
}

function parseRegion(objectName: string) {
    const parts = objectName.split("/").filter(Boolean);
    // parts[0]=incoming|archive, [1]=commodity, [2]=doc
    if (parts.length >= 5) return parts[3]; // region folder
    return "-";
}

function buildCleanObjectName(objectName: string) {
    const parts = objectName.split("/").filter(Boolean);
    const source = parts[0];
    const commodity = parts[1] || "unknown";
    const kind = parts[2] || "doc";

    const underKind = parts.slice(3);
    const filename = underKind[underKind.length - 1] || "file";
    const folder = underKind.slice(0, -1);

    const base = filename.replace(/\.[^/.]+$/, "");
    const cleanFile = `${base}.json`;

    return ["clean", commodity, kind, ...folder, cleanFile].join("/");
}

export class FirebaseReportsRepository implements IReportsRepository {
    async listReports(): Promise<ReportBase[]> {
        const bucketName = process.env.GCS_BUCKET;
        if (!bucketName) throw new Error("Missing GCS_BUCKET environment variable");

        // Fallback to purely firebase admin SDK's storage handling
        const bucket = admin.storage().bucket(bucketName);

        const [incoming] = await bucket.getFiles({ prefix: "incoming/", autoPaginate: true, maxResults: 2000 });
        const [archive] = await bucket.getFiles({ prefix: "archive/", autoPaginate: true, maxResults: 2000 });
        const [clean] = await bucket.getFiles({ prefix: "clean/", autoPaginate: true, maxResults: 5000 });

        const cleanSet = new Set<string>(
            clean
                .map((f) => f.name || "")
                .filter((n) => n.includes("/doc/") && n.toLowerCase().endsWith(".json"))
        );

        const all = [...incoming, ...archive]
            .map((f) => f.name || "")
            .filter((n) => n.includes("/doc/") && !n.endsWith("/"));

        const items: ReportBase[] = all.map((objectName) => {
            const source: Source = objectName.startsWith("incoming/") ? "incoming" : "archive";
            const active = source === "incoming";

            const parts = objectName.split("/").filter(Boolean);
            const commodity = parts[1] || "unknown";

            const cleanObjectName = buildCleanObjectName(objectName);
            const hasClean = cleanSet.has(cleanObjectName);

            const meta =
                (source === "incoming" ? incoming : archive).find((x) => x.name === objectName)?.metadata ?? {};

            const createdAt =
                (meta?.updated as string) ||
                (meta?.timeCreated as string) ||
                new Date().toISOString();

            return {
                id: `${source}:${commodity}:${fileNameOnly(objectName)}`,
                createdAt,
                commodity,
                region: parseRegion(objectName),
                fileName: fileNameOnly(objectName),
                source,
                active,
                objectName,
                cleanObjectName,
                hasClean,
            };
        });

        items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

        return items;
    }
}
