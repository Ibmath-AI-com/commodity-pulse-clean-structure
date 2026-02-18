// FILE: src/infrastructure/services/n8n.service.http.ts
import "server-only";
import { requireN8nConfig } from "@/src/infrastructure/n8n/n8n.config";
import type {
  IN8nService,
  N8nWorkflowKey,
  N8nCallOptions,
} from "@/src/application/services/n8n.service.interface";

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(t) };
}

function resolveWebhookUrl(cfg: ReturnType<typeof requireN8nConfig>, workflow: N8nWorkflowKey): string {
  // Map your workflow keys to the webhook env vars you actually have.
  switch (workflow) {
    case "report_generate":
      return cfg.webhooks.generatingReportUrl;
    case "prices_refresh":
      return cfg.webhooks.generatingPricesUrl;
    case "predict":
      return cfg.webhooks.forecastingUrl;

    // You do NOT have env vars for these right now. Fail clearly.
    case "upload_list":
    case "rag_ingest":
    default:
      throw new Error(
        `n8n workflow "${workflow}" is not configured. Add a webhook URL env var (e.g. N8N_WEBHOOK_*_URL) or change the workflow key mapping.`
      );
  }
}

export class HttpN8nService implements IN8nService {
  async call<TReq extends object, TRes>(
    workflow: N8nWorkflowKey,
    payload: TReq,
    opts?: N8nCallOptions 
  ): Promise<TRes> {
    // Strict validation happens only when you actually call n8n
    const cfg = requireN8nConfig();

    const url = resolveWebhookUrl(cfg, workflow);

    const u = new URL(url);
    u.searchParams.set("token", cfg.token);

    const timeoutMs = opts?.timeoutMs ?? 60_000;
    const t = withTimeout(timeoutMs);

    try {
      const res = await fetch(u.toString(), {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: t.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`n8n(${workflow}) failed ${res.status}: ${text}`);
      }

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        const text = await res.text().catch(() => "");
        throw new Error(`n8n(${workflow}) returned non-JSON: ${text}`);
      }

      return (await res.json()) as TRes;
    } finally {
      t.clear();
    }
  }
}
