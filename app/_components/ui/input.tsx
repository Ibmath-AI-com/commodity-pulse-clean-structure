import * as React from "react";
import { cn } from "@/app/_components/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "input w-full bg-transparent outline-none",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
