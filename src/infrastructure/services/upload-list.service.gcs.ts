// FILE: src/infrastructure/services/upload-list.service.gcs.ts
import "server-only";

import type {
  IUploadListService,
  UploadListQuery,
  UploadListResult,
} from "@/src/application/services/upload-list.service.interface";
import type { IGcsService } from "@/src/application/services/gcs.service.interface";
import type { UploadListItem } from "@/src/entities/models/prediction";

type SourceKind = "doc" | "rdata";
type Root = "incoming" | "archive";

function stripExt(filename: string) {
  const i = filename.lastIndexOf(".");
  return i > 0 ? filename.slice(0, i) : filename;
}

function isExcelLike(name: string) {
  const n = (name || "").toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv");
}

export class GcsUploadListService implements IUploadListService {
  constructor(private readonly gcs: IGcsService) {}

  async list(input: UploadListQuery): Promise<UploadListResult> {
    const commodity = (input.commodity ?? "").trim().toLowerCase();
    if (!commodity) throw new Error("Missing commodity");

    // kept for forward-compat (your old code used it in the response, but listing didn’t partition by region)
    const region = (input.region ?? "global").trim().toLowerCase();

    // Match your old API: clean/{commodity}/eventsignals/
    const eventSignalsPrefix = `clean/${commodity}/eventsignals/`;
    const ev = await this.gcs.listObjects("active", { prefix: eventSignalsPrefix, maxResults: 1 });
    const eventSignalsExists = ev.items.some((it) => it.name && !it.name.endsWith("/"));

    const kinds: SourceKind[] = ["doc", "rdata"];
    const roots: Root[] = ["incoming", "archive"];

    const listed = await Promise.all(
      roots.flatMap((root) =>
        kinds.map(async (kind) => {
          const prefix = `${root}/${commodity}/${kind}/`;
          const bucketKey = root === "archive" ? "archive" : "active";

          const { items } = await this.gcs.listObjects(bucketKey, { prefix, maxResults: 300 });

          const fileItems = items.filter((it) => it.name && !it.name.endsWith("/"));

          const enriched: UploadListItem[] = await Promise.all(
            fileItems.map(async (it) => {
              const filename = it.name.split("/").pop() || "";
              const base = stripExt(filename);

              const isActive = root === "incoming";

              // Only active files can have generated outputs considered valid (matches old code)
              const reportObjectName = `clean/${commodity}/${kind}/${base}.json`;
              const reportExists = isActive
                ? await this.gcs.objectExists("active", reportObjectName)
                : false;

              const pricesObjectName = `clean/${commodity}/${kind}/${commodity}_prices.json`;
              const pricesExists =
                isActive && isExcelLike(filename)
                  ? await this.gcs.objectExists("active", pricesObjectName)
                  : false;

              return {
                name: it.name,
                size: it.size,
                contentType: it.contentType,
                updated: it.updated,

                kind,
                root,
                isActive,

                reportExists,
                reportObjectName,

                pricesExists,
                pricesObjectName,
              } as UploadListItem;
            })
          );

          return enriched;
        })
      )
    );

    const mergedItems = listed
      .flat()
      .sort((a, b) => {
        // active first, then newest first
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return new Date(String(b.updated ?? 0)).getTime() - new Date(String(a.updated ?? 0)).getTime();
      });

    // region currently not used in the storage layout (same as your old code),
    // but kept in case you later add region partitioning.
    void region;

    return { items: mergedItems, eventSignalsExists };
  }
}
