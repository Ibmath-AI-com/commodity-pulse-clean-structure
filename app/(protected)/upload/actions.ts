// FILE: app/(protected)/upload/actions.ts
"use server";

import { redirect } from "next/navigation";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export async function listUploadsAction(input: { commodity: string; region?: string }) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > listUploadsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IListUploadsController");
        return await controller({
          commodity: input.commodity,
          region: input.region ?? "global",
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function initUploadAction(input: {
  commodity: string;
  region?: string;
  filename: string;
  contentType: string;
  kind: "doc" | "rdata";
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > initUploadAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IInitUploadController");
        return await controller({
          commodity: input.commodity,
          region: input.region ?? "global",
          filename: input.filename,
          contentType: input.contentType,
          kind: input.kind,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

function encodeDocumentFilename(filename: string) {
  const raw = String(filename ?? "").trim().replace(/\+/g, " ");
  return encodeURIComponent(raw)
    .replace(/%20/g, "+")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function buildDocumentIdFromSourceKey(sourceKey: string) {
  const safeBase = String(sourceKey ?? "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return `doc_${safeBase}`;
}

function decodeDocumentFilename(filename: string) {
  const normalized = String(filename ?? "").trim().replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function extractPublishedAt(value: string) {
  const match = String(value ?? "").match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

function buildDocSourceKeyVariants(value: string) {
  const raw = String(value ?? "").trim().replace(/\\/g, "/");
  if (!raw) return [];

  const parts = raw.split("/").filter(Boolean);
  const commodity = parts.length > 1 ? parts[1] : "";
  const filename = parts[parts.length - 1] ?? "";
  const normalizedFilename = decodeDocumentFilename(filename);
  const encodedFilename = encodeDocumentFilename(normalizedFilename);

  const variants = new Set<string>([raw]);

  if (commodity) {
    variants.add(`incoming/${commodity}/doc/${normalizedFilename}`);
    variants.add(`incoming/${commodity}/doc/${encodedFilename}`);
  }

  return Array.from(variants).filter(Boolean);
}

export async function upsertUploadedDocumentRowAction(input: {
  commodity: string;
  filename: string;
  sourceKey?: string;
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > upsertUploadedDocumentRowAction", op: "function.nextjs" },
    async () => {
      try {
        const { postgres } = await import("@/src/infrastructure/db/postgres.client");
        const commodity = String(input.commodity ?? "").trim().toLowerCase();
        const originalFilename = String(input.filename ?? "").trim();
        const normalizedFilename = decodeDocumentFilename(originalFilename);
        const sourceKey =
          String(input.sourceKey ?? "").trim() ||
          `incoming/${commodity}/doc/${encodeDocumentFilename(normalizedFilename)}`;
        const filename = String(sourceKey.split("/").pop() ?? "").trim() || encodeDocumentFilename(normalizedFilename);
        const documentId = buildDocumentIdFromSourceKey(sourceKey);
        const publishedAt = extractPublishedAt(filename);
        const fileHash = documentId;
        const legacyFilenameVariants = Array.from(
          new Set(
            [
              originalFilename,
              normalizedFilename,
              normalizedFilename.replace(/ /g, "+"),
              filename,
            ].filter(Boolean)
          )
        );
        const legacySourceKeyVariants = legacyFilenameVariants.map(
          (value) => `incoming/${commodity}/doc/${value}`
        );
        const legacyDocumentIds = legacySourceKeyVariants.map(buildDocumentIdFromSourceKey);

        await postgres.query(
          `
            insert into public.documents (
              document_id,
              commodity,
              filename,
              source_key,
              source,
              published_at,
              file_hash,
              processing_status
            )
            values ($1, $2, $3, $4, $4, $5, $6, 'completed')
            on conflict (document_id) do update
            set commodity = excluded.commodity,
                filename = excluded.filename,
                source_key = excluded.source_key,
                source = excluded.source,
                published_at = excluded.published_at,
                file_hash = excluded.file_hash,
                processing_status = 'completed',
                ingested_at = now()
          `,
          [documentId, commodity, filename, sourceKey, publishedAt, fileHash]
        );

        const existingRows = await postgres.query<{
          document_id: string;
          filename: string;
          source_key: string;
        }>(
          `
            select document_id, filename, source_key
            from public.documents
            where commodity = $1
              and source_key like $2
          `,
          [commodity, `incoming/${commodity}/doc/%`]
        );

        const staleDocumentIds = Array.from(
          new Set(
            [
              ...legacyDocumentIds,
              ...existingRows.rows
                .filter((row) => {
                  const candidateFilename = decodeDocumentFilename(row.filename);
                  const candidateSourceKeyFilename = decodeDocumentFilename(
                    row.source_key.split("/").pop() ?? ""
                  );

                  return (
                    candidateFilename === normalizedFilename ||
                    candidateSourceKeyFilename === normalizedFilename
                  );
                })
                .map((row) => row.document_id),
            ].filter((value) => value && value !== documentId)
          )
        );

        if (staleDocumentIds.length) {
          await postgres.query(
            `
              delete from public.documents
              where commodity = $1
                and document_id <> $5
                and (
                  document_id = any($2::text[])
                  or filename = any($3::text[])
                  or source_key = any($4::text[])
                )
            `,
            [commodity, staleDocumentIds, legacyFilenameVariants, legacySourceKeyVariants, documentId]
          );
        }

        return {
          ok: true as const,
          documentId,
          commodity,
          filename,
          sourceKey,
        };
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function deleteUploadsAction(input: {
  objectNames: string[];
  sourceFiles?: string[];
  mode?: "report" | "prices";
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > deleteUploadsAction", op: "function.nextjs" },
    async () => {
      try {
        if (input.mode === "prices") {
          const { postgres } = await import("@/src/infrastructure/db/postgres.client");
          const storage = getInjection("IObjectStorageService");
          const objectNames = (input.objectNames ?? [])
            .map((value) => String(value ?? "").trim())
            .filter(Boolean);
          const sourceFiles = (input.sourceFiles ?? objectNames)
            .map((value) => String(value ?? "").trim())
            .filter(Boolean);

          if (!objectNames.length || !sourceFiles.length) {
            return { ok: false, error: "Missing price object names" };
          }

          await Promise.all(
            objectNames.map((objectName) =>
              storage.deleteObject(
                "active",
                objectName,
                { timeoutMs: 15000, ignoreNotFound: true }
              )
            )
          );

          const result = await postgres.query<{ source_file: string }>(
            `
              delete from public.commodity_prices
              where source_file = any($1::text[])
              returning source_file
            `,
            [sourceFiles]
          );

          return {
            ok: true,
            deleted: result.rows.map((row) => row.source_file).filter(Boolean),
          };
        }

        if (input.mode === "report") {
          const { postgres } = await import("@/src/infrastructure/db/postgres.client");
          const storage = getInjection("IObjectStorageService");
          const objectNames = (input.objectNames ?? [])
            .map((value) => String(value ?? "").trim())
            .filter(Boolean);

          if (!objectNames.length) {
            return { ok: false, error: "Missing document object names" };
          }

          const sourceKeyVariants = Array.from(
            new Set(objectNames.flatMap((value) => buildDocSourceKeyVariants(value)))
          );
          const documentIds = sourceKeyVariants.map(buildDocumentIdFromSourceKey);

          await Promise.all(
            sourceKeyVariants.map((objectName) =>
              storage.deleteObject(
                "active",
                objectName,
                { timeoutMs: 15000, ignoreNotFound: true }
              )
            )
          );

          await postgres.query(
            `
              delete from public.market_events
              where document_id = any($1::text[])
            `,
            [documentIds]
          );

          await postgres.query(
            `
              delete from public.document_generation_status
              where document_id = any($1::text[])
            `,
            [documentIds]
          );

          const result = await postgres.query<{ source_key: string }>(
            `
              delete from public.documents
              where document_id = any($1::text[])
                 or source_key = any($2::text[])
              returning source_key
            `,
            [documentIds, sourceKeyVariants]
          );

          return {
            ok: true,
            deleted: result.rows.map((row) => row.source_key).filter(Boolean),
          };
        }

        const controller = getInjection("IDeleteUploadsController");
        return await controller({ objectNames: input.objectNames });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function archiveUploadsAction(input: { objectNames: string[] }) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > archiveUploadsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IArchiveUploadsController");
        return await controller({ objectNames: input.objectNames });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function getUploadNewsDetailsAction(input: {
  commodity: string;
  sourcePath?: string;
  documentId?: string;
  fileName?: string;
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > getUploadNewsDetailsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IGetUploadNewsDetailsController");
        return await controller({
          commodity: input.commodity,
          sourcePath: input.sourcePath,
          documentId: input.documentId,
          fileName: input.fileName,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export type UploadPriceRecord = {
  commodityGroup: string;
  productName: string;
  basis: string | null;
  region: string | null;
  subRegion: string | null;
  marketLabel: string | null;
  currency: string | null;
  unit: string | null;
  priceDate: string | null;
  timing: string | null;
  price: number | null;
  change: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  priceMid: number | null;
  source: string | null;
  sourceFile: string | null;
  createdAt: string | null;
};

export async function getUploadPriceRecordsAction(input: {
  commodity: string;
  sourceFile: string;
}) {
  const { getInjection } = await import("@/di/container");
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > getUploadPriceRecordsAction", op: "function.nextjs" },
    async () => {
      try {
        const { postgres } = await import("@/src/infrastructure/db/postgres.client");
        const sourceFile = String(input.sourceFile ?? "").trim();
        const sourceFileVariants = Array.from(
          new Set(
            [
              sourceFile,
              sourceFile.replace(/ /g, "+"),
              sourceFile.replace(/\+/g, " "),
            ].filter(Boolean)
          )
        );
        const rows = await postgres.query<{
          commodity_group: string;
          product_name: string;
          basis: string | null;
          region: string | null;
          sub_region: string | null;
          market_label: string | null;
          currency: string | null;
          unit: string | null;
          price_date: string | Date | null;
          timing: string | null;
          price: number | null;
          change: number | null;
          price_low: number | null;
          price_high: number | null;
          price_mid: number | null;
          source: string | null;
          source_file: string | null;
          created_at: string | Date | null;
        }>(
          `
            select
              commodity_group,
              product_name,
              basis,
              region,
              sub_region,
              market_label,
              currency,
              unit,
              price_date,
              timing,
              price,
              change,
              price_low,
              price_high,
              price_mid,
              source,
              source_file,
              created_at
            from public.commodity_prices
            where lower(commodity_group) = $1
              and source_file = any($2::text[])
            order by price_date desc nulls last, created_at desc nulls last, market_label asc nulls last
          `,
          [String(input.commodity ?? "").trim().toLowerCase(), sourceFileVariants]
        );

        return rows.rows.map((row) => ({
          commodityGroup: row.commodity_group,
          productName: row.product_name,
          basis: row.basis,
          region: row.region,
          subRegion: row.sub_region,
          marketLabel: row.market_label,
          currency: row.currency,
          unit: row.unit,
          priceDate:
            row.price_date instanceof Date ? row.price_date.toISOString() : row.price_date ?? null,
          timing: row.timing,
          price: row.price,
          change: row.change,
          priceLow: row.price_low,
          priceHigh: row.price_high,
          priceMid: row.price_mid,
          source: row.source,
          sourceFile: row.source_file,
          createdAt:
            row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at ?? null,
        })) as UploadPriceRecord[];
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export type UploadSourceReadUrlResult = {
  url: string;
  bucketName: string;
  objectName: string;
  expiresMinutes: number;
};

export async function createUploadSourceReadUrlAction(
  input: { objectName: string }
): Promise<UploadSourceReadUrlResult> {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > createUploadSourceReadUrlAction", op: "function.nextjs" },
    async () => {
      try {
        const storage = getInjection("IObjectStorageService");
        return await storage.createSignedReadUrl(
          "active",
          { objectName: input.objectName, expiresMinutes: 15 },
          { timeoutMs: 15000 }
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}
