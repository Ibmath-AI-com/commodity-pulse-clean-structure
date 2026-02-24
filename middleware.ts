import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.error("MIDDLEWARE_ENTER", req.nextUrl.pathname);

  try {
    // your auth check
    return NextResponse.next();
  } catch (e) {
    console.error("MIDDLEWARE_ERROR", e);
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
}