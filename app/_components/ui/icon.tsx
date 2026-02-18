import * as React from "react";
import { cn } from "@/app/_components/utils";

export function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("pointer-events-none", className)}>
      {children}
    </span>
  );
}
