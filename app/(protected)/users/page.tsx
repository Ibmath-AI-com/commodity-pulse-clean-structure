import { redirect } from "next/navigation";

import UsersMain from "@/app/_components/ui/users/main";
import { getCurrentUserFromSession } from "@/lib/auth/get-current-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
  const user = await getCurrentUserFromSession();

  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");

  return <UsersMain />;
}
