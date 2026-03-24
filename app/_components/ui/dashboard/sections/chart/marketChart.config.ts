// FILE: app/_components/ui/dashboard/sections/chart/marketChart.config.ts

import type { ChartData, ChartOptions } from "chart.js";
import type { DashboardChartPoint } from "@/src/entities/models/dashboard";
import { toChartLabels, buildBand } from "./marketChart.model";

const CONFIDENCE_BAND_PCT = 0.1; // 6%

function getYAxisBounds(values: number[]) {
  if (!values.length) {
    return { min: 360, max: 440 };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = Math.max(5, Math.ceil((rawMax - rawMin) * 0.1));

  return {
    min: Math.floor((rawMin - pad) / 10) * 10,
    max: Math.ceil((rawMax + pad) / 10) * 10,
  };
}

export function makeMarketChartData(
  points: DashboardChartPoint[]
): ChartData<"line", number[], string> {
  const clean = points.filter(
    (p) =>
      typeof p.actualPrice === "number" &&
      typeof p.predictedPrice === "number" &&
      !!p.date
  );

  const actual = clean.map((p) => p.actualPrice as number);
  const predicted = clean.map((p) => p.predictedPrice as number);
  const { upper, lower } = buildBand(predicted, CONFIDENCE_BAND_PCT);

  return {
    labels: toChartLabels(clean.map((p) => p.date)),
    datasets: [
      {
        label: "Band Lower",
        data: lower,
        borderColor: "rgba(16,185,129,0)",
        backgroundColor: "rgba(16,185,129,0)",
        pointRadius: 0,
        tension: 0.35,
      },
      {
        label: "Confidence Band",
        data: upper,
        borderColor: "rgba(16,185,129,0)",
        backgroundColor: "rgba(16,185,129,0.10)",
        pointRadius: 0,
        tension: 0.35,
        fill: "-1",
      },
      {
        label: "Actual",
        data: actual,
        borderColor: "rgba(15, 23, 42, 0.95)",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "rgba(15, 23, 42, 0.95)",
        tension: 0.35,
        spanGaps: false,
      },
      {
        label: "Predicted",
        data: predicted,
        borderColor: "rgba(59, 130, 246, 0.95)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.35,
        spanGaps: false,
      },
    ],
  };
}

export function marketChartOptions(
  points: DashboardChartPoint[]
): ChartOptions<"line"> {
  const clean = points.filter(
    (p) =>
      typeof p.actualPrice === "number" &&
      typeof p.predictedPrice === "number" &&
      !!p.date
  );

  const predicted = clean.map((p) => p.predictedPrice as number);
  const actual = clean.map((p) => p.actualPrice as number);
  const { upper, lower } = buildBand(predicted, CONFIDENCE_BAND_PCT);

  const { min, max } = getYAxisBounds([
    ...actual,
    ...predicted,
    ...upper,
    ...lower,
  ]);

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.98)",
        titleColor: "#0f172a",
        bodyColor: "#0f172a",
        borderColor: "rgba(226,232,240,1)",
        borderWidth: 1,
        displayColors: true,
      },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        min,
        max,
        ticks: { color: "#64748b", font: { size: 11, weight: 600 } },
        grid: { color: "rgba(226,232,240,0.9)" },
      },
      x: {
        ticks: { color: "#94a3b8", font: { size: 11, weight: 600 } },
        grid: { display: false },
      },
    },
  };
}