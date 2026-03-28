// FILE: app/_components/ui/dashboard/sections/chart/marketChart.model.ts

export function toChartLabels(dates: string[]) {
  return dates.map((value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
  });
}

export function buildBand(
  predicted: number[],
  pct = 0.02
) {
  const upper = predicted.map((v) => v * (1 + pct));
  const lower = predicted.map((v) => v * (1 - pct));
  return { upper, lower };
}