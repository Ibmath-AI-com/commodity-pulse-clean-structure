"use client";

import { MenuIcon } from "lucide-react";

import type { RiskLevel, RiskPayload } from "../types/types";

function findItem(risk: RiskPayload, key: string, title: string) {
  const items = Array.isArray(risk?.items) ? risk.items : [];
  return (
    items.find((x) => (x.key ?? "").toLowerCase() === key.toLowerCase()) ||
    items.find((x) => (x.title ?? "").toLowerCase() === title.toLowerCase()) ||
    null
  );
}

// Map level -> your existing badge + bg classes (do NOT change structure)
function levelToBadgeClass(level?: RiskLevel) {
  if (level === "HIGH") return "bg-high";
  if (level === "MEDIUM") return "bg-med-yellow";
  return "bg-low";
}

function levelToRowBg(level?: RiskLevel) {
  if (level === "HIGH") return "risk-bg-high";
  if (level === "MEDIUM") return "risk-bg-med";
  return "risk-bg-low";
}

export function RiskAnalysisPanel({ risk }: { risk: RiskPayload }) {
  const downside = findItem(risk, "downside", "Downside Risk");
  const compression = findItem(risk, "compression", "Margin Compression");
  const execution = findItem(risk, "execution", "Execution");

  const downsideLevel: RiskLevel = downside?.level ?? "MEDIUM";
  const compressionLevel: RiskLevel = compression?.level ?? "MEDIUM";
  const executionLevel: RiskLevel = execution?.level ?? "MEDIUM";

  const metaDate = risk?.asOf ?? "2026-01-30";
  const metaVersion = risk?.modelVersion ?? 1;

  return (
    <div className="cp-card p-4">
      <div className="table-header">
        <div className="th-left">
          <span className="cp-card-head">RISK ANALYSIS</span>
          <MenuIcon size={16} />
        </div>

        <div className="th-meta">
          Data last updated <strong>{metaDate}</strong>{" "}
          <i className="fas fa-robot" aria-hidden="true" /> Model version {metaVersion}{" "}
          <i className="fas fa-save" aria-hidden="true" />
        </div>
      </div>

      <div className={`risk-item ${levelToRowBg(downsideLevel)} mt-3`}>
        <div className="risk-header">
          Downside Risk <span className="risk-sep">|</span>{" "}
          <span className={`risk-badge ${levelToBadgeClass(downsideLevel)}`}>{downsideLevel}</span>
        </div>
        <div className="risk-desc">
          {downside?.bullet ?? "1.0% downside from margin band (-5 USD/t max) (477 – 487)"}
        </div>
      </div>

      <div className={`risk-item ${levelToRowBg(compressionLevel)}`}>
        <div className="risk-header">
          Margin Compression <span className="risk-sep">|</span>{" "}
          <span className={`risk-badge ${levelToBadgeClass(compressionLevel)}`}>{compressionLevel}</span>
        </div>
        <div className="risk-desc">
          {compression?.bullet ?? "Expected range is tight (p10 477 to p90 487 = 10 USD/t width)"}
        </div>
      </div>

      <div className={`risk-item ${levelToRowBg(executionLevel)}`}>
        <div className="risk-header">
          Execution <span className="risk-sep">|</span>{" "}
          <span className={`risk-badge ${levelToBadgeClass(executionLevel)}`}>{executionLevel}</span>
        </div>
        <div className="risk-desc">
          {execution?.bullet ?? "Strong acceptance proxy for this band (chanceToWin = Medium)"}
        </div>
      </div>
    </div>
  );
}
