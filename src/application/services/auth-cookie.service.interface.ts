export interface IAuthCookieService {
  getSessionToken(): Promise<string | null>;
  setAuthCookies(input: {
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<void>;
  clearAuthCookies(): Promise<void>;
}