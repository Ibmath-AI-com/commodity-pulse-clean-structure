import "server-only";

import { cookies } from "next/headers";

import { getInjection } from "@/di/container";
import type { GetCurrentUserUseCaseResult } from "@/src/application/use-cases/auth/get-current-user.use-case";

export async function getCurrentUserFromSession(): Promise<GetCurrentUserUseCaseResult | null> {
  const sessionService = getInjection("ISessionService");
  const getCurrentUser = getInjection("IGetCurrentUserUseCase");

  const cookieStore = await cookies();
  const sessionToken = await sessionService.getSessionToken(cookieStore);
  if (!sessionToken) return null;

  try {
    return await getCurrentUser(sessionToken);
  } catch {
    return null;
  }
}
