// src/application/services/auth-client.service.interface.ts

export type AuthMode = "login" | "logout";

export type AuthCredential = {
  uid: string;
  email: string | null;
  getIdToken(): Promise<string>;
};

// The Gatekeeper
export interface IAuthServerService {
  authenticate(input: { email: string; password: string }): Promise<AuthCredential>;
  logout(): Promise<void>;
}