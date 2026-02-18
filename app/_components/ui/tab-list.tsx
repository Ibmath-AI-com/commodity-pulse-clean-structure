import * as React from "react";
import { cn } from "@/app/_components/utils";

export function TabList<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-2 border-b">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "px-3 py-2 text-sm border-b-2",
            value === t.value
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
