import * as React from "react";
import { cn } from "@/app/_components/utils";

export function StatusBadge({
  status,
}: {
  status: "Idle" | "Running" | "Done" | "Error";
}) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-xs font-medium",
        status === "Done" && "bg-green-100 text-green-700",
        status === "Running" && "bg-blue-100 text-blue-700",
        status === "Error" && "bg-red-100 text-red-700",
        status === "Idle" && "bg-gray-100 text-gray-700"
      )}
    >
      {status}
    </span>
  );
}
