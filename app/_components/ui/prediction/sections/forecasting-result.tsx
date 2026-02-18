"use client";

import * as React from "react";
import clsx from "clsx";
import { Info, TrendingDown, TrendingUp } from "lucide-react";

import type { PredictionBundle } from "@/src/entities/models/prediction";
import type { Direction, Strength} from "../types/types";

export type ForecastResultsCardProps = {
  bundle: PredictionBundle | null;
  tenderUnit: string;
  p10: number | null;
  p90: number | null;
  sentimentScore: number | null;
  direction: Direction;
  strength: Strength;
};

export function ForecastResultsCard({
  bundle,
  tenderUnit,
  p10,
  p90,
  sentimentScore,
  direction,
  strength,
}: ForecastResultsCardProps) {
  const predicted =
    bundle?.tender?.tenderPredictedPrice != null
      ? String(bundle.tender.tenderPredictedPrice)
      : "--";

  const hasP10 = typeof p10 === "number" && Number.isFinite(p10);
  const hasP90 = typeof p90 === "number" && Number.isFinite(p90);
  const range = hasP10 && hasP90 ? `${p10}–${p90}` : "--";

  return (
    <div className="cp-card p-4">
      <div className="table-header">
        <span className="cp-card-head">FORECAST RESULTS</span>
        <Info size={16} />
      </div>

      <div className="forecast-stats">
        <div className="stat-box">
          <div className="stat-label">Predicted Price</div>
          <div className="stat-value">
            {predicted} <span className="stat-unit">({tenderUnit})</span>
          </div>
          <div className="stat-sub">
            Recent average: +8.3%{" "}
            <i className="fas fa-arrow-up" aria-hidden="true" />
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Expected Range</div>
          <div className="stat-value">
            {range} <span className="stat-unit">({tenderUnit})</span>
          </div>
          <div className="stat-sub">Recent average error: +5.2%</div>
        </div>
      </div>

      <div className="market-bias">
        <div className="mb-left mr-8">
          <div className="mb-title">Market Bias:</div>
          <div className="mb-sub">
            Sentiment score:{" "}
            {sentimentScore != null ? sentimentScore.toFixed(2) : "—"}
          </div>
        </div>

        <div
          className={clsx(
            "cp-bias-indicator mb-center",
            direction === "Bullish" && "bull",
            direction === "Bearish" && "bear",
            direction === "Neutral" && "neutral",
            strength === "Strong" && "strong",
            strength === "Moderate" && "moderate",
            strength === "Slight" && "slight"
          )}
        >
          <span className="cp-bias-text">
            {strength !== "N/A" ? `${strength.toUpperCase()} ` : ""}
            <br />
            {direction.toUpperCase()}
          </span>

          {direction === "Bullish" ? (
            <TrendingUp size={16} />
          ) : direction === "Bearish" ? (
            <TrendingDown size={16} />
          ) : null}
        </div>

        <div className="mb-right ml-8">60th percentile • 1% outliers</div>
      </div>
    </div>
  );
}
