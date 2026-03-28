"use server";

import { redirect } from "next/navigation";

import { getInjection } from "@/di/container";
import { getCurrentUserFromSession } from "@/lib/auth/get-current-user";

export type UsersListItem = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: "active" | "disabled";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type ListUsersResult = { ok: true; users: UsersListItem[] } | { ok: false; error: string };

export type CreateUserResult =
  | { ok: true; user: UsersListItem }
  | { ok: false; error: string };

async function requireAdminUser() {
  const user = await getCurrentUserFromSession();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}

function toRow(
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    status: "active" | "disabled";
    mustChangePassword: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }
): UsersListItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function listUsersAction(): Promise<ListUsersResult> {
  await requireAdminUser();

  try {
    const userRepo = getInjection("IUserRepository");
    const users = await userRepo.listAll();
    return { ok: true, users: users.map((user) => toRow(userRepo.toSafeUser(user))) };
  } catch (err) {
    const crashReporterService = getInjection("ICrashReporterService");
    crashReporterService.report(err);
    return { ok: false, error: "Failed to load users." };
  }
}

export async function createUserAction(formData: FormData): Promise<CreateUserResult> {
  await requireAdminUser();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user").trim().toLowerCase();
  const isAdmin = role === "admin";

  if (!name) return { ok: false, error: "Name is required." };
  if (!email || !email.includes("@")) return { ok: false, error: "Valid email is required." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (role !== "user" && role !== "admin") {
    return { ok: false, error: "Role must be user or admin." };
  }

  try {
    const userRepo = getInjection("IUserRepository");
    const passwordHasher = getInjection("IPasswordHasher");

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return { ok: false, error: "A user with this email already exists." };
    }

    const passwordHash = await passwordHasher.hash(password);
    const created = await userRepo.create({
      name,
      email,
      passwordHash,
      isAdmin,
      mustChangePassword: true,
    });

    return { ok: true, user: toRow(userRepo.toSafeUser(created)) };
  } catch (err) {
    const crashReporterService = getInjection("ICrashReporterService");
    crashReporterService.report(err);
    return { ok: false, error: "Failed to create user." };
  }
}
