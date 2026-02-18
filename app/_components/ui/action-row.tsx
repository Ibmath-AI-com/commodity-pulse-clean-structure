import * as React from "react";
import { cn } from "@/app/_components/utils";

export function ActionRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}
