import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { DashboardPrediction, DashboardKpis } from "@/src/entities/models/dashboard";

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

export type IGetDashboardKpisUseCase = ReturnType<typeof getDashboardKpisUseCase>;

export const getDashboardKpisUseCase =
  (instrumentation: IInstrumentationService) =>
  async (rows: DashboardPrediction[]): Promise<DashboardKpis> =>
    instrumentation.startSpan(
      { name: "getDashboardKpisUseCase", op: "function" },
      async () => {
        const total = rows.length;

        const successRows = rows.filter(
          (r) => r.status === "success"
        );
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

        const successRatePct = total
          ? Math.round((success / total) * 100)
          : 0;

        const marketSignals = rows.reduce((acc, r) => {
          const c = r.news?.count;
          return acc + (typeof c === "number" ? c : 0);
        }, 0);

        const utcToday = todayUTC();
        const newSignalsToday = rows.reduce((acc, r) => {
          const events = r.news?.events;
          if (!Array.isArray(events)) return acc;
          return (
            acc +
            events.filter((e) => e?.event_date === utcToday).length
          );
        }, 0);

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
        };
      }
    );
