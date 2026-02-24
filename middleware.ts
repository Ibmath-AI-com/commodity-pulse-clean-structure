import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Example: adjust cookie name to your real one
  const cookieNames = req.cookies.getAll().map(c => c.name);
  const hasSession = cookieNames.includes("session") || cookieNames.includes("__session") || cookieNames.includes("auth_token");

  console.error("MIDDLEWARE_CTX", {
    path,
    hasSession,
    cookieNames: cookieNames.slice(0, 20),
    host: req.headers.get("host"),
    proto: req.headers.get("x-forwarded-proto"),
  });

  try {
    // your existing auth check here
    return NextResponse.next();
  } catch (e) {
    console.error("MIDDLEWARE_AUTH_ERROR", {
      path,
      msg: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
}