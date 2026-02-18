import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { DashboardPrediction, Insight } from "@/src/entities/models/dashboard";

function mapEventTypeToLabel(t?: string | null) {
  const k = String(t ?? "").toLowerCase();
  if (k.includes("supply")) return "SUPPLY";
  if (k.includes("tender")) return "TENDER";
  if (k.includes("price")) return "PRICE";
  if (k.includes("demand")) return "DEMAND";
  if (k.includes("policy")) return "POLICY";
  return "NEWS";
}

function pillClass(kind: "orange" | "green") {
  if (kind === "orange") return "bg-med-yellow";
  return "bg-med";
}

export type IGetDashboardInsightsUseCase = ReturnType<typeof getDashboardInsightsUseCase>;

export const getDashboardInsightsUseCase =
  (instrumentation: IInstrumentationService) =>
  async (
    rows: DashboardPrediction[],
    limitEvents: number
  ): Promise<Insight[]> =>
    instrumentation.startSpan(
      { name: "getDashboardInsightsUseCase", op: "function" },
      async () => {
        const events =
          rows
            .flatMap((r) =>
              Array.isArray(r.news?.events) ? r.news!.events! : []
            )
            .filter(Boolean)
            .slice(0, limitEvents);

        const insights: Insight[] = [];

        for (const ev of events) {
          const impact = String(
            ev?.impact_direction ?? ""
          ).toLowerCase();

          const importance =
            typeof ev?.importance_score === "number"
              ? ev.importance_score
              : null;

          const importanceLabel =
            importance == null
              ? "MED"
              : importance >= 0.7
              ? "HIGH"
              : importance >= 0.45
              ? "MED"
              : "LOW";

          insights.push({
            title: String(ev?.headline ?? "—"),
            text: String(ev?.evidence_summary ?? "—").slice(0, 90),
            meta: "",
            pills: [
              {
                label: mapEventTypeToLabel(ev?.event_type),
                className: "list-header",
              },
              { label: "|", className: "separater" },
              {
                label:
                  impact === "bearish"
                    ? "BEAR"
                    : impact === "bullish"
                    ? "BULL"
                    : "NEUTRAL",
                className: pillClass("orange"),
              },
              {
                label: importanceLabel,
                className: pillClass("green"),
              },
            ],
            footer: `${importanceLabel} | ${String(
              ev?.event_type ?? "news"
            )}`,
          });
        }

        return insights;
      }
    );
