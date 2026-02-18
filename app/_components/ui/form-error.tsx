import { cn } from "@/app/_components/utils";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className={cn("mt-1 text-sm font-semibold text-red-600")}>
      {message}
    </div>
  );
}
