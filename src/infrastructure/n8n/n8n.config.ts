// FILE: src/infrastructure/n8n/n8n.config.ts
import "server-only";

function opt(name: string): string | null {
  const v = process.env[name];
  const t = v?.trim();
  return t ? t : null;
}

function req(name: string): string {
  const v = opt(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function reqNumber(name: string, fallback: number): number {
  const raw = opt(name);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number env: ${name}`);
  return n;
}

/**
 * Non-throwing snapshot. Safe to import anywhere (including /login).
 * Use requireN8nConfig() inside actual n8n calls.
 */
export const n8nConfig = {
  token: opt("N8N_WEBHOOK_TOKEN"),


  webhooks: {
    generatingReportUrl: opt("N8N_WEBHOOK_GENERATING_REPORT_URL"),
    generatingPricesUrl: opt("N8N_WEBHOOK_GENERATING_PRICES_URL"),
    forecastingUrl: opt("N8N_WEBHOOK_FORECASTING_URL"),
  },
} as const;

/**
 * Strict config for when you actually call n8n.
 * Call this inside the n8n client methods (not at module top-level).
 */
export function requireN8nConfig() {
  return {
    token: req("N8N_WEBHOOK_TOKEN"),
    webhooks: {
      generatingReportUrl: req("N8N_WEBHOOK_GENERATING_REPORT_URL"),
      generatingPricesUrl: req("N8N_WEBHOOK_GENERATING_PRICES_URL"),
      forecastingUrl: req("N8N_WEBHOOK_FORECASTING_URL"),
    },
  } as const;
}
