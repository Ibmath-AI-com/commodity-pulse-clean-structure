// FILE: src/entities/models/dashboard.ts

export type Status = "success" | "failed" | "running" | "pending";

/* ===============================
   News / Events
================================ */

export type NewsEvent = {
  event_type?: string | null;
  headline?: string | null;
  evidence_summary?: string | null;
  impact_direction?: string | null;
  importance_score?: number | null;
  event_date?: string | null; // YYYY-MM-DD
};

export type PredNews = {
  count?: number | null;
  events?: NewsEvent[] | null;
};

/* ===============================
   Outputs / Signals
================================ */

export type PredSignals = {
  trend?: string | null;
};

export type PredOutputs = {
  tenderPredictedPrice?: number | null;
  signals?: PredSignals | null;
};

/* ===============================
   Core Prediction Record
================================ */

export type DashboardPrediction = {
  id: string;
  uid: string;

  createdAt: Date | null;
  runtimeMs: number | null;

  commodity: string | null;
  futureDate: string | null; // YYYY-MM-DD

  basisLabels: string[] | null;
  basisKeys: string[] | null;
  basePrices: number[] | null;

  status: Status;
  n8nHttpStatus: number | null;

  outputs: PredOutputs | null;
  error: string | null;

  news: PredNews | null;
};

/* ===============================
   Chart
================================ */

export type DashboardChartPoint = {
  date: string; // YYYY-MM-DD
  actualPrice: number | null;
  predictedPrice: number | null;
};

/* ===============================
   Insights
================================ */

export type Insight = {
  title: string;
  text: string;
  meta: string;
  pills: Array<{
    label: string;
    className: string;
  }>;
  footer: string;
};

/* ===============================
   KPIs used in Dashboard
================================ */

export type DashboardKpis = {
  total: number;
  success: number;

  activeForecasts: number;
  successRatePct: number;

  thisWeek: number;
  lastWeek: number;
  wowPct: number | null;

  marketSignals: number;
  newSignalsToday: number;

  forecastAccuracyPct30d: number | null;
  matchedPointCount30d: number | null;
  avgForecastErrorPct30d: number | null;
};

export type DashboardStatusFilter = "all" | "success" | "error";

export type DashboardFiltersProps = {
  qText: string;
  onQTextChange: (v: string) => void;

  filteredCount: number;
  totalCount: number;

  busy: boolean;
  uid: string | null;

  onClear: () => void;
  onRefresh: () => void;

  err: string | null;
};

export type DashboardKpiRowProps = {
  activeForecasts: number;
  activeWowPct: number | null;
  accuracyRatePct: number | null;
  marketSignals: number;
  newSignalsToday: number;
  matchedPointCount30d: number | null;
  avgForecastErrorPct: number | null;
};