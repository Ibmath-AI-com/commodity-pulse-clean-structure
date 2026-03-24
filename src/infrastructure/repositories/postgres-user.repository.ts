// E:\AI Projects\commodity-pulse-clean-structure\src\infrastructure\repositories\postgres-user.repository.ts
import "server-only";
import type { Pool } from "pg";
import type { IUserRepository } from "@/src/application/repositories/user.repository.interface";
import type { SafeUser, User } from "@/src/entities/models/auth";

type DbUserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  status: User["status"];
  must_change_password: boolean;
  failed_login_count: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function mapUser(row: DbUserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    isAdmin: row.is_admin,
    status: row.status,
    mustChangePassword: row.must_change_password,
    failedLoginCount: row.failed_login_count,
    lockedUntil: row.locked_until,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const res = await this.pool.query<DbUserRow>(
      `select * from app_user where email = $1 limit 1`,
      [email]
    );
    return res.rowCount ? mapUser(res.rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const res = await this.pool.query<DbUserRow>(
      `select * from app_user where id = $1 limit 1`,
      [id]
    );
    return res.rowCount ? mapUser(res.rows[0]) : null;
  }

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    isAdmin: boolean;
    mustChangePassword: boolean;
  }): Promise<User> {
    const res = await this.pool.query<DbUserRow>(
      `
      insert into app_user (name, email, password_hash, is_admin, must_change_password)
      values ($1, $2, $3, $4, $5)
      returning *
      `,
      [
        input.name,
        input.email,
        input.passwordHash,
        input.isAdmin,
        input.mustChangePassword,
      ]
    );

    return mapUser(res.rows[0]);
  }

  async updatePassword(input: {
    userId: string;
    passwordHash: string;
    mustChangePassword: boolean;
  }): Promise<void> {
    await this.pool.query(
      `
      update app_user
      set password_hash = $2,
          must_change_password = $3,
          failed_login_count = 0,
          locked_until = null,
          updated_at = now()
      where id = $1
      `,
      [input.userId, input.passwordHash, input.mustChangePassword]
    );
  }

  async incrementFailedLogin(userId: string, lockedUntil: Date | null): Promise<void> {
    await this.pool.query(
      `
      update app_user
      set failed_login_count = failed_login_count + 1,
          locked_until = $2,
          updated_at = now()
      where id = $1
      `,
      [userId, lockedUntil]
    );
  }

  async resetFailedLogin(userId: string): Promise<void> {
    await this.pool.query(
      `
      update app_user
      set failed_login_count = 0,
          locked_until = null,
          updated_at = now()
      where id = $1
      `,
      [userId]
    );
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.pool.query(
      `
      update app_user
      set last_login_at = now(),
          updated_at = now()
      where id = $1
      `,
      [userId]
    );
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}