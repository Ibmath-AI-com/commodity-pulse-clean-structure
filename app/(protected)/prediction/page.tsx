// FILE: app/(protected)/prediction/page.tsx
import PredictionMain from "@/app/_components/ui/prediction/main";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PredictionPage() {
  return <PredictionMain />;
}