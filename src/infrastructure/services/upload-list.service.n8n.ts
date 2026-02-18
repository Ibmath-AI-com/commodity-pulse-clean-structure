import "server-only";

import type {
  IUploadListService,
  UploadListQuery,
  UploadListResult,
} from "@/src/application/services/upload-list.service.interface";
import type { IN8nService } from "@/src/application/services/n8n.service.interface";

export class N8nUploadListService implements IUploadListService {
  constructor(private readonly n8n: IN8nService) {}

  async list(input: UploadListQuery): Promise<UploadListResult> {
    const payload = {
      commodity: input.commodity,
      region: input.region ?? "global",
    };

    return this.n8n.call<typeof payload, UploadListResult>("upload_list", payload, {
      timeoutMs: 30_000,
      idempotencyKey: `upload_list:${payload.commodity}:${payload.region}`,
    });
  }
}
