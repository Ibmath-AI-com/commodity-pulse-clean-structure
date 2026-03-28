// FILE: app/(protected)/upload/page.tsx
import UploadMain from "@/app/_components/ui/upload/main";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UploadPage() {
  return <UploadMain />;
}