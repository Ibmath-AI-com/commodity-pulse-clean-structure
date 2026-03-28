// FILE: src/application/use-cases/dashboard/get-dashboard-kpis.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type {
  DashboardChartPoint,
  DashboardKpis,
  DashboardPrediction,
} from "@/src/entities/models/dashboard";

function isoTodayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type IGetDashboardKpisUseCase = ReturnType<typeof getDashboardKpisUseCase>;

export const getDashboardKpisUseCase =
  (instrumentation: IInstrumentationService) =>
  async (
    rows: DashboardPrediction[],
    chart: DashboardChartPoint[]
  ): Promise<DashboardKpis> =>
    instrumentation.startSpan(
      { name: "getDashboardKpisUseCase", op: "function" },
      async () => {
        const total = rows.length;

        const successRows = rows.filter((r) => r.status === "success");
        const success = successRows.length;

        const today = isoTodayLocal();
        const activeForecasts = successRows.filter(
          (r) => String(r.futureDate ?? "") >= today
        ).length;

        const w0 = daysAgo(7);
        const w1 = daysAgo(14);

        const thisWeek = successRows.filter(
          (r) => r.createdAt && r.createdAt >= w0
        ).length;

        const lastWeek = successRows.filter(
          (r) => r.createdAt && r.createdAt >= w1 && r.createdAt < w0
        ).length;

        const wowPct =
          lastWeek > 0
            ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
            : null;

        const successRatePct = total ? Math.round((success / total) * 100) : 0;

        const marketSignals = rows.reduce((acc, r) => {
          const c = r.news?.count;
          return acc + (typeof c === "number" ? c : 0);
        }, 0);

        const utcToday = todayUTC();
        const newSignalsToday = rows.reduce((acc, r) => {
          const events = r.news?.events;
          if (!Array.isArray(events)) return acc;
          return acc + events.filter((e) => e?.event_date === utcToday).length;
        }, 0);

        const cutoff = daysAgo(30);

        const evalPoints = chart
          .filter((p) => {
            const d = toDate(p.date);
            return (
              d &&
              d >= cutoff &&
              typeof p.actualPrice === "number" &&
              typeof p.predictedPrice === "number" &&
              p.actualPrice !== 0
            );
          })
          .sort((a, b) => a.date.localeCompare(b.date));

        const matchedPointCount30d = evalPoints.length;

        const avgForecastErrorPct30d =
          matchedPointCount30d > 0
            ? Math.round(
                evalPoints.reduce((acc, p) => {
                  const actual = p.actualPrice as number;
                  const predicted = p.predictedPrice as number;
                  return acc + Math.abs((actual - predicted) / actual) * 100;
                }, 0) / matchedPointCount30d
              )
            : null;

        const forecastAccuracyPct30d =
          avgForecastErrorPct30d == null
            ? null
            : Math.max(0, 100 - avgForecastErrorPct30d);

        return {
          total,
          success,
          activeForecasts,
          successRatePct,
          thisWeek,
          lastWeek,
          wowPct,
          marketSignals,
          newSignalsToday,
          forecastAccuracyPct30d,
          matchedPointCount30d,
          avgForecastErrorPct30d,
        };
      }
    );