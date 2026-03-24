// FILE: src/infrastructure/services/upload-page.service.os.ts
import "server-only";

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


function buildDocumentId(objectName: string): string {
  return `doc_${objectName.replace(/[^\w]+/g, "_").toLowerCase()}`;
}

export class OSUploadPageService implements IUploadPageService {
  constructor(private readonly ost: IObjectStorageService) {}

 async list(query: ListUploadsQuery): Promise<ListUploadsResult> {
  const commodity = query.commodity.trim().toLowerCase();
  const region = sanitizeRegion(query.region);

  try {
    const docPrefix = `incoming/${commodity}/doc/`;
    const rdataPrefix = `incoming/${commodity}/rdata/`;
    const evPrefix = `clean/${commodity}/eventsignals/`;

    const [docsListed, rdataListed, ev] = await Promise.all([
      this.ost.listObjects(
        "active",
        { prefix: docPrefix, maxResults: 200 },
        { timeoutMs: 15000 }
      ),
      this.ost.listObjects(
        "active",
        { prefix: rdataPrefix, maxResults: 200 },
        { timeoutMs: 15000 }
      ),
      this.ost.listObjects(
        "active",
        { prefix: evPrefix, maxResults: 1 },
        { timeoutMs: 15000 }
      ),
    ]);

    const eventSignalsExists = ev.items.length > 0;

    const raw = [...(docsListed.items ?? []), ...(rdataListed.items ?? [])]
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

    const items: UploadListItem[] = await Promise.all(
      raw.map(async (it) => {
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

    return {
      ok: true,
      bucketName: docsListed.bucketName,
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
    const objectName = `incoming/${commodity}/doc/${cmd.filename}`;

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