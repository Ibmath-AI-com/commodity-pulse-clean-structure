// FILE: src/components/prediction/commodity-select.tsx
"use client";

import * as React from "react";
import { COMMODITIES } from "@/lib/common/options";

type CommoditySelectProps = {
  value: string;
  disabled?: boolean;
  onChange: (nextRaw: string) => void;
};

export function CommoditySelect({
  value,
  disabled = false,
  onChange,
}: CommoditySelectProps) {
  return (
    <div className="cp-form-group">
      <label>Commodity</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {COMMODITIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}