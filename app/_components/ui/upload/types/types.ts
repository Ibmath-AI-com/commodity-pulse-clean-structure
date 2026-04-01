// FILE: app/_components/ui/upload/types/types.ts
import type { DocumentNewsSummary } from "@/src/entities/models/news";
import type { UploadKind, UploadListItem } from "@/src/entities/models/upload";

export type Busy = "idle" | "init" | "uploading" | "verifying" | "listing";
export type Mode = "report" | "prices";

export type UploadModalState =
  | null
  | {
      open: true;
      action: "delete" | "archive";
      mode: Mode;
      objectNames: string[];
      sourceFiles?: string[];
      displayName: string;
      alsoDeletesGenerated: boolean;
    };

export type CommodityOption = { value: string; label: string };

export type PricesRow = UploadListItem & {
  pricesExists?: boolean;
  pricesObjectName?: string;
};

export type DocsRow = UploadListItem & {
  reportExists?: boolean;
  reportObjectName?: string;
  isActive?: boolean;
  newsSummary?: DocumentNewsSummary;
};
