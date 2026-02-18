// marketChart.model.ts

export const marketLabels = ["Mar 25","Mar 26","Apr 16","Apr 25","Apr 24","Apr 25","Apr 26","Apr 23","+ 26"];

export const marketActual = [395, 410, 402, 412, 405, 398, 410, 422, 425];

export const marketPredicted = [392, 406, 404, 410, 407, 401, 413, 418, 421];

// The per-point band width used in your HTML (predicted ± bandWidth[i])
export const marketBandWidth = [10, 11, 12, 11, 10, 11, 12, 13, 12];

export function buildBand(predicted: number[], width: number[]) {
  const upper = predicted.map((v, i) => v + (width[i] ?? 0));
  const lower = predicted.map((v, i) => v - (width[i] ?? 0));
  return { upper, lower };
}
