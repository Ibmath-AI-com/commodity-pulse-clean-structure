// FILE: src/components/prediction/commodity-select.tsx
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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
      <label className="ui-form-label">
        Commodity
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="ui-form-control ui-form-select"
        >
          {COMMODITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}
