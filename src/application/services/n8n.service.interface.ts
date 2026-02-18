//E:\AI Projects\commodity-clean-structure\src\infrastructure\services\n8n.service.interface.ts
export type N8nWorkflowKey =
  | "predict"
  | "report_generate"
  | "upload_list"
  | "rag_ingest"
  | "prices_refresh";

export type N8nCallOptions = {
  idempotencyKey?: string;
  timeoutMs?: number;
};

export interface IN8nService {
  call<TReq extends object, TRes>(
    workflow: N8nWorkflowKey,
    payload: TReq,
    opts?: N8nCallOptions
  ): Promise<TRes>;
}

