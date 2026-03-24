// FILE: app/_components/ui/dashboard/sections/recent-predictions.tsx
"use client";

import { cx, fmtDate, safeUpper } from "@/app/_components/utils";
import type { DashboardPrediction } from "@/src/entities/models/dashboard";

function trendTone(r: DashboardPrediction) {
  const t = String(r?.outputs?.signals?.trend ?? "").toLowerCase();

  if (t === "bullish") {
    return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  }

  if (t === "bearish") {
    return "bg-rose-50 border border-rose-200 text-rose-800";
  }

  return "bg-slate-50 border border-slate-200 text-slate-700";
}

type RecentPredictionsProps = {
  items: DashboardPrediction[];
  busy?: boolean;
  onSelect?: (row: DashboardPrediction) => void;
};

export function CpRecentPredictions({
  items,
  busy = false,
  onSelect,
}: RecentPredictionsProps) {
  return (
    <div className="cp-card p-0 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
        <div className="h2">Recent Predictions</div>
        <div className="text-[11px] font-bold text-slate-500">
          {items.length} items
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {items.length ? (
          items.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-4"
              onClick={() => onSelect?.(r)}
            >
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-600 truncate">
                  {safeUpper(r.commodity)}
                </div>

                <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{fmtDate(r.createdAt)}</span>
                  <span>{r.futureDate || "—"}</span>
                  <span>
                    {safeUpper(
                      ((r.basisLabels?.length ? r.basisLabels : r.basisKeys) ??
                        [])[0] ?? "—"
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[12px] font-bold text-slate-600">
                    {typeof r.outputs?.tenderPredictedPrice === "number"
                      ? `${r.outputs.tenderPredictedPrice.toFixed(1)} USD/t`
                      : "—"}
                  </div>

                  <div
                    className={cx(
                      "mt-1 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase",
                      trendTone(r)
                    )}
                  >
                    {safeUpper(r.outputs?.signals?.trend ?? "—")}
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-[12px] font-semibold text-slate-500">
            {busy
              ? "Loading..."
              : "No predictions yet. Run your first forecast from the Prediction page."}
          </div>
        )}
      </div>
    </div>
  );
}