// FILE: src/components/ui/home/chart/marketChart.config.ts
import type { ChartData, ChartOptions } from "chart.js";
import { buildBand, marketActual, marketBandWidth, marketLabels, marketPredicted } from "./marketChart.model";

export function makeMarketChartData(): ChartData<"line", number[], string> {
  const { upper, lower } = buildBand(marketPredicted, marketBandWidth);

  return {
    labels: marketLabels,
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
        data: marketActual,
        borderColor: "rgba(15, 23, 42, 0.95)",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "rgba(15, 23, 42, 0.95)",
        tension: 0.35,
      },
      {
        label: "Predicted",
        data: marketPredicted,
        borderColor: "rgba(59, 130, 246, 0.95)",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.35,
      },
    ],
  };
}

export const marketChartOptions: ChartOptions<"line"> = {
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
      min: 360,
      max: 440,
      ticks: { color: "#64748b", font: { size: 11, weight: 600 } },
      grid: { color: "rgba(226,232,240,0.9)" },
    },
    x: {
      ticks: { color: "#94a3b8", font: { size: 11, weight: 600 } },
      grid: { display: false },
    },
  },
};
