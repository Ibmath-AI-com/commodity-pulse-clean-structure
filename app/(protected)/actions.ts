"use server";

import { redirect } from "next/navigation";
import { getInjection } from "@/di/container";

export async function logOut() {
  const logoutController = getInjection("ILogoutController");
  await logoutController(); // adjust if your controller expects input
  redirect("/login");
}
