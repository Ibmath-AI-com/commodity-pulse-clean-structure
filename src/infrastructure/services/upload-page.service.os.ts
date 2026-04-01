// FILE: src/infrastructure/services/upload-page.service.os.ts
import "server-only";

import { postgres } from "@/src/infrastructure/db/postgres.client";

import type {
  IUploadPageService,
  ListUploadsQuery,
  InitUploadCommand,
  DeleteUploadsCommand,
  ArchiveUploadsCommand,
} from "@/src/application/services/upload.service.interface";
import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";
import type {
  ListUploadsResult,
  UploadListItem,
  InitUploadResult,
  DeleteUploadsResult,
  ArchiveUploadsResult,
} from "@/src/entities/models/upload";

function sanitizeRegion(region?: string): string {
  return (region || "global").trim().toLowerCase();
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function safeDecode(value: string): string {
  const normalized = String(value ?? "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function encodeDocFilename(value: string): string {
  const raw = String(value ?? "").trim().replace(/\+/g, " ");
  return encodeURIComponent(raw)
    .replace(/%20/g, "+")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function normalizeDocSourcePath(sourceKey: string, commodity: string, filename: string): string {
  const raw = String(sourceKey || "").trim().replace(/\\/g, "/");
  const safeFilename = safeDecode(String(filename || "").trim()).replace(/^\/+/, "");

  if (!raw) {
    return `incoming/${commodity}/doc/${safeFilename}`;
  }

  const noScheme = raw.replace(/^[a-z]+:\/\/[^/]+\//i, "");
  const withoutQuery = noScheme.split(/[?#]/, 1)[0] ?? noScheme;
  const decoded = safeDecode(withoutQuery);
  const withoutLeadingSlash = decoded.replace(/^\/+/, "");
  const incomingIndex = withoutLeadingSlash.toLowerCase().indexOf("incoming/");

  if (incomingIndex >= 0) {
    return withoutLeadingSlash.slice(incomingIndex);
  }

  if (withoutLeadingSlash.startsWith(`active/incoming/`)) {
    return withoutLeadingSlash.slice("active/".length);
  }

  if (withoutLeadingSlash.startsWith(`archive/incoming/`)) {
    return withoutLeadingSlash.slice("archive/".length);
  }

  if (withoutLeadingSlash.includes("/doc/") || withoutLeadingSlash.startsWith("incoming/")) {
    return withoutLeadingSlash;
  }

  if (safeFilename) {
    return `incoming/${commodity}/doc/${safeFilename}`;
  }

  return withoutLeadingSlash;
}

async function resolveReportObjectName(
  storage: IObjectStorageService,
  commodity: string,
  sourcePath: string,
  filename: string
): Promise<{ reportObjectName: string; reportExists: boolean }> {
  const sourceFileName = safeDecode(sourcePath.split("/").pop() || "").trim();
  const displayFileName = safeDecode(String(filename || "").trim());

  const baseCandidates = Array.from(
    new Set(
      [sourceFileName, displayFileName]
        .filter(Boolean)
        .map(stripExt)
        .filter(Boolean)
    )
  );

  for (const base of baseCandidates) {
    const objectName = `clean/${commodity}/doc/${base}.json`;
    const exists = await storage
      .objectExists("active", objectName, { timeoutMs: 15000 })
      .catch(() => false);

    if (exists) {
      return { reportObjectName: objectName, reportExists: true };
    }
  }

  const fallbackBase = baseCandidates[0] ?? stripExt(displayFileName || sourceFileName || "document");
  return {
    reportObjectName: `clean/${commodity}/doc/${fallbackBase}.json`,
    reportExists: false,
  };
}

function buildDocumentId(objectName: string): string {
  return `doc_${objectName.replace(/[^\w]+/g, "_").toLowerCase()}`;
}

type DocumentRow = {
  document_id: string;
  commodity: string;
  filename: string;
  source_key: string;
  ingested_at: string | Date | null;
  processing_status?: string | null;
  news_status?: "running" | "success" | "failed" | null;
  images_status?: "running" | "success" | "failed" | null;
  vectors_status?: "running" | "success" | "failed" | null;
};

type PriceSourceRow = {
  commodity_group: string;
  source_file: string | null;
  created_at: string | Date | null;
  record_count: number | string;
};

export class OSUploadPageService implements IUploadPageService {
  constructor(private readonly ost: IObjectStorageService) {}

 async list(query: ListUploadsQuery): Promise<ListUploadsResult> {
  const commodity = query.commodity.trim().toLowerCase();
  const region = sanitizeRegion(query.region);

  try {
    const docPrefix = `incoming/${commodity}/doc/`;
    const [docsListed, pricesListed] = await Promise.all([
      postgres.query<DocumentRow>(
        `
          select distinct on (d.source_key)
            d.document_id,
            d.commodity,
            d.filename,
            d.source_key,
            d.ingested_at,
            d.processing_status,
            dgs.news_status,
            dgs.images_status,
            dgs.vectors_status
          from public.documents d
          left join public.document_generation_status dgs
            on dgs.document_id = d.document_id
          where lower(d.commodity) = $1
            and lower(d.source_key) like $2
          order by d.source_key, d.ingested_at desc nulls last
        `,
        [commodity, `${docPrefix}%`]
      ),
      postgres.query<PriceSourceRow>(
        `
          select distinct on (cp.source_file)
            cp.commodity_group,
            cp.source_file,
            cp.created_at,
            count(*) over (partition by cp.source_file) as record_count
          from public.commodity_prices cp
          where lower(cp.commodity_group) = $1
            and cp.source_file is not null
          order by cp.source_file, cp.created_at desc nulls last
        `,
        [commodity]
      ),
    ]);
    const eventSignalsExists = false;

    const docItems: UploadListItem[] = await Promise.all(
      (docsListed.rows ?? [])
        .filter((row) => Boolean(row.source_key) && Boolean(row.filename))
        .filter((row) => String(row.filename).toLowerCase().endsWith(".pdf"))
        .map(async (row) => {
          const sourcePath = normalizeDocSourcePath(row.source_key, commodity, row.filename);
          const sourceFileName = safeDecode(sourcePath.split("/").pop() || row.filename);
          const displayName = safeDecode(row.filename || sourceFileName);
          const { reportObjectName, reportExists } = await resolveReportObjectName(
            this.ost,
            commodity,
            sourcePath,
            displayName
          );
          const processingStatus = String(row.processing_status ?? "").trim().toLowerCase();
          const statuses = [row.news_status, row.images_status, row.vectors_status];
          const generationStatus = statuses.every((value) => value === "success")
            ? "success"
            : statuses.some((value) => value === "failed")
              ? "failed"
              : "running";

          return {
            documentId: row.document_id || buildDocumentId(row.source_key),
            commodity,
            path: row.source_key,
            sourcePath,
            name: displayName,
            processingStatus,
            generationStatus,
            updatedAt:
              row.ingested_at instanceof Date
                ? row.ingested_at.toISOString()
                : row.ingested_at ?? undefined,
            kind: "doc",
            reportExists:
              reportExists || processingStatus === "processed" || generationStatus === "success",
            reportObjectName,
          } as UploadListItem;
        })
    );

    const priceItems: UploadListItem[] = (pricesListed.rows ?? [])
      .filter((row) => Boolean(row.source_file))
      .map((row) => {
        const rawSourceFile = String(row.source_file ?? "").trim();
        const sourceFile = safeDecode(rawSourceFile);
        const processingStatus = "processed";

        return {
          documentId: buildDocumentId(rawSourceFile),
          commodity,
          path: rawSourceFile,
          sourcePath: rawSourceFile,
          sourceFile: rawSourceFile,
          name: sourceFile,
          recordCount: Number(row.record_count ?? 0) || 0,
          processingStatus,
          updatedAt:
            row.created_at instanceof Date
              ? row.created_at.toISOString()
              : row.created_at ?? undefined,
          kind: "rdata",
          pricesExists: true,
        } as UploadListItem;
      });

    const raw = [...docItems, ...priceItems]
      .filter((it) => Boolean(it.name))
      .filter((it) => {
        const name = String(it.name).toLowerCase();
        return (
          name.endsWith(".pdf") ||
          name.endsWith(".csv") ||
          name.endsWith(".xlsx") ||
          name.endsWith(".xls")
        );
      });

    const bucketItems: UploadListItem[] = await Promise.all(
      raw.map(async (it) => {
        if ("documentId" in it && "path" in it) {
          return it as UploadListItem;
        }

        const filename = it.name.split("/").pop() || "";
        const base = stripExt(filename);

        const isDoc = it.name.includes(`/doc/`);
        const isRdata = it.name.includes(`/rdata/`);

        const reportObjectName = `clean/${commodity}/doc/${base}.json`;
        const pricesObjectName = it.name;

        const [reportExists, pricesExists] = await Promise.all([
          isDoc
            ? this.ost
                .objectExists("active", reportObjectName, { timeoutMs: 15000 })
                .catch(() => false)
            : Promise.resolve(false),
          isRdata
            ? Promise.resolve(true)
            : this.ost
                .objectExists("active", pricesObjectName, { timeoutMs: 15000 })
                .catch(() => false),
        ]);

        return {
          documentId: buildDocumentId(it.name),
          commodity,
          path: it.name,
          name: filename,
          size: it.size,
          contentType: it.contentType,
          updatedAt: it.updated,
          kind: isDoc ? "doc" : "rdata",
          reportExists,
          reportObjectName: isDoc ? reportObjectName : undefined,
          pricesExists,
          pricesObjectName: isRdata ? pricesObjectName : undefined,
        } as UploadListItem;
      })
    );

    const items = bucketItems;

    return {
      ok: true,
      bucketName: "active",
      commodity,
      region,
      eventSignalsExists,
      items,
    } as ListUploadsResult;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list uploads";
    return {
      ok: false,
      error: message,
    } as ListUploadsResult;
  }
}

  async init(cmd: InitUploadCommand): Promise<InitUploadResult> {
    const commodity = cmd.commodity.trim().toLowerCase();
    const kind = cmd.kind === "rdata" ? "rdata" : "doc";
    const filename = kind === "doc" ? encodeDocFilename(cmd.filename) : cmd.filename;
    const objectName = `incoming/${commodity}/${kind}/${filename}`;

    const signed = await this.ost.createSignedUploadUrl(
      "active",
      {
        objectName,
        contentType: cmd.contentType,
      },
      { timeoutMs: 15000 }
    );

    return {
      ok: true,
      uploadUrl: signed.url,
      objectName: signed.objectName,
      kind,
    } as InitUploadResult;
  }

  async delete(cmd: DeleteUploadsCommand): Promise<DeleteUploadsResult> {
    const deleted: string[] = [];
    const failed: string[] = [];

    await Promise.all(
      cmd.objectNames.map(async (objectName) => {
        try {
          await this.ost.deleteObject("active", objectName, {
            timeoutMs: 15000,
            ignoreNotFound: true,
          });
          deleted.push(objectName);
        } catch {
          failed.push(objectName);
        }
      })
    );

    return {
      ok: true,
      deleted,
      failed,
    } as DeleteUploadsResult;
  }

async archive(cmd: ArchiveUploadsCommand): Promise<ArchiveUploadsResult> {
  const archived: string[] = [];
  const failed: string[] = [];

  await Promise.all(
    cmd.objectNames.map(async (objectName) => {
      const archiveObjectName = objectName.startsWith("incoming/")
        ? objectName.replace(/^incoming\//, "archive/")
        : `archive/${objectName}`;

      try {
          await this.ost.copyObject(
            "active",
            {
              sourceObjectName: objectName,
              destObjectName: archiveObjectName,
            },
            { timeoutMs: 15000 }
          );

        await this.ost.deleteObject("active", objectName, {
          timeoutMs: 15000,
          ignoreNotFound: false,
        });

        archived.push(objectName);
      } catch {
        failed.push(objectName);
      }
    })
  );

  return {
    ok: failed.length === 0,
    archived,
    failed,
  } as ArchiveUploadsResult;
}
    
}
