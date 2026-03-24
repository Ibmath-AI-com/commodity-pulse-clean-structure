// E:\AI Projects\commodity-pulse-clean-structure\src\infrastructure\repositories\postgres-session.repository.ts
import "server-only";
import type { Pool } from "pg";
import type { ISessionRepository } from "@/src/application/repositories/session.repository.interface";
import type { Session } from "@/src/entities/models/auth";

function mapSession(row: any): Session {
  return {
    id: row.id,
    userId: row.user_id,
    sessionTokenHash: row.session_token_hash,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
    createdAt: row.created_at,
  };
}

export class PostgresSessionRepository implements ISessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: {
    userId: string;
    sessionTokenHash: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<Session> {
    const res = await this.pool.query(
      `
      insert into auth_session (
        user_id,
        session_token_hash,
        refresh_token_hash,
        user_agent,
        ip_address,
        expires_at
      )
      values ($1, $2, $3, $4, $5, $6)
      returning *
      `,
      [
        input.userId,
        input.sessionTokenHash,
        input.refreshTokenHash,
        input.userAgent,
        input.ipAddress,
        input.expiresAt,
      ]
    );

    return mapSession(res.rows[0]);
  }

  async findActiveBySessionTokenHash(sessionTokenHash: string): Promise<Session | null> {
    const res = await this.pool.query(
      `
      select *
      from auth_session
      where session_token_hash = $1
        and revoked_at is null
        and expires_at > now()
      limit 1
      `,
      [sessionTokenHash]
    );

    return res.rowCount ? mapSession(res.rows[0]) : null;
  }

  async revokeBySessionTokenHash(sessionTokenHash: string, reason: string): Promise<void> {
    await this.pool.query(
      `
      update auth_session
      set revoked_at = now(),
          revoke_reason = $2
      where session_token_hash = $1
        and revoked_at is null
      `,
      [sessionTokenHash, reason]
    );
  }

  async revokeAllByUserId(userId: string, reason: string): Promise<void> {
    await this.pool.query(
      `
      update auth_session
      set revoked_at = now(),
          revoke_reason = $2
      where user_id = $1
        and revoked_at is null
      `,
      [userId, reason]
    );
  }
}