import { redirect } from "next/navigation";

import { getCurrentUserFromSession } from "@/lib/auth/get-current-user";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserFromSession();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
