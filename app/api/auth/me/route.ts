import { NextResponse } from "next/server";

import { getCurrentUserFromSession } from "@/lib/auth/get-current-user";

export async function GET() {
  const user = await getCurrentUserFromSession();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
