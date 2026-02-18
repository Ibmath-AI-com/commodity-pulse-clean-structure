// E:\AI Projects\commodity-clean-structure\src\application\services\session.service.interface.ts

export interface ISessionService {
  createSessionCookie(input: { idToken: string }): Promise<void>;
  clearSessionCookie(): Promise<void>;
  validateSessionCookie(input: { sessionCookie: string }): Promise<{ uid: string; email: string | null }>;
}