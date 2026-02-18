"use client";

import { useMemo } from "react";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

import type { RunStepKey, RunTimelineState } from "../types/types";

type RunTimelineProps = {
  state: RunTimelineState;
  cx?: (...c: Array<string | false | null | undefined>) => string; // optional for backward compat
};

export function RunTimeline({ state }: RunTimelineProps) {
  if (!state.visible) return null;

  const steps: Array<{ key: RunStepKey; label: string }> = [
    { key: "report", label: "Analyzing market data..." },
    { key: "forecast", label: "Generating predictions..." },
    { key: "refresh", label: "Finalizing chart..." },
  ];

  const hasError = useMemo(
    () => Object.values(state.steps).some((v) => v === "error"),
    [state.steps]
  );

  const isRunning = useMemo(
    () => Object.values(state.steps).some((v) => v === "running"),
    [state.steps]
  );

  const isDone = useMemo(
    () => !hasError && steps.every((s) => state.steps[s.key] === "done"),
    [hasError, state.steps]
  );

  const pct = useMemo(() => {
    const doneCount = steps.filter((s) => state.steps[s.key] === "done").length;
    return Math.round((doneCount / steps.length) * 100);
  }, [state.steps]);

  const status = useMemo(() => {
    const running = steps.find((s) => state.steps[s.key] === "running");
    if (running) return running.label;
    if (state.message) return state.message;

    if (pct < 30) return "Analyzing market data...";
    if (pct < 70) return "Generating predictions...";
    return "Finalizing chart...";
  }, [state.steps, state.message, pct]);

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
              className={`w-4 h-4 shrink-0 ${
                isRunning ? "animate-spin text-blue-600" : "text-slate-400"
              }`}
            />
          )}

          <span
            className={`text-[12px] font-medium ${
              hasError ? "text-rose-700" : "text-slate-600"
            } truncate`}
          >
            {hasError ? "Run failed" : status}
          </span>
        </div>

        <span className="text-[12px] font-bold text-slate-900 shrink-0">
          {pct}%
        </span>
      </div>

      <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            hasError ? "bg-rose-600" : "bg-blue-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
