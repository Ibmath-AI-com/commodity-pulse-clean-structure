export interface ITokenService {
  generateToken(): string;
  hashToken(token: unknown): string;
}