import type { SafeUser, User } from "@/src/entities/models/auth";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: {
    name: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
    mustChangePassword: boolean;
  }): Promise<User>;
  updatePassword(input: {
    userId: string;
    passwordHash: string;
    mustChangePassword: boolean;
  }): Promise<void>;
  incrementFailedLogin(userId: string, lockedUntil: Date | null): Promise<void>;
  resetFailedLogin(userId: string): Promise<void>;
  touchLastLogin(userId: string): Promise<void>;
  toSafeUser(user: User): SafeUser;
}