// FILE: app/_components/ui/prediction/sections/run-timeline.tsx
"use client";

import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

import type { RunStepKey, RunTimelineState } from "../types/types";

type RunTimelineProps = {
  state: RunTimelineState;
  cx?: (...c: Array<string | false | null | undefined>) => string; // optional for backward compat
};

const STEPS: Array<{ key: RunStepKey; label: string }> = [
  { key: "report", label: "Analyzing market data..." },
  { key: "forecast", label: "Generating predictions..." },
  { key: "refresh", label: "Finalizing chart..." },
];

export function RunTimeline({ state }: RunTimelineProps) {
  // Hooks are gone; derived values computed unconditionally.
  const stepValues = Object.values(state.steps);
  const hasError = stepValues.some((v) => v === "error");
  const isRunning = stepValues.some((v) => v === "running");
  const isDone = !hasError && STEPS.every((s) => state.steps[s.key] === "done");

  const doneCount = STEPS.filter((s) => state.steps[s.key] === "done").length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  const running = STEPS.find((s) => state.steps[s.key] === "running");
 
  let status: string;

  if (running?.label) {
    status = running.label;
  } else if (state.message) {
    status = state.message;
  } else if (pct < 30) {
    status = "Analyzing market data...";
  } else if (pct < 70) {
    status = "Generating predictions...";
  } else {
    status = "Finalizing chart...";
  }
  // Conditional rendering AFTER calculations is fine.
  if (!state.visible) return null;

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {hasError ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : isDone ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <RefreshCw
              className={`w-4 h-4 shrink-0 ${isRunning ? "animate-spin text-blue-600" : "text-slate-400"}`}
            />
          )}

          <span
            className={`text-[12px] font-medium ${hasError ? "text-rose-700" : "text-slate-600"} truncate`}
          >
            {hasError ? "Run failed" : status}
          </span>
        </div>

        <span className="text-[12px] font-bold text-slate-900 shrink-0">{pct}%</span>
      </div>

      <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${hasError ? "bg-rose-600" : "bg-blue-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}