import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const sql = neon(process.env.DATABASE_URL);

export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id                TEXT PRIMARY KEY,
      date              DATE NOT NULL,
      buy_in_amount     NUMERIC NOT NULL,
      chip_ratio        NUMERIC NOT NULL,
      is_custom_ratio   BOOLEAN NOT NULL DEFAULT FALSE,
      custom_cash_amount NUMERIC,
      custom_chip_amount NUMERIC,
      is_active         BOOLEAN NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS session_members (
      id          SERIAL PRIMARY KEY,
      session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      member_id   TEXT NOT NULL REFERENCES members(id),
      buy_ins     INTEGER NOT NULL DEFAULT 1,
      chips_left  NUMERIC,
      UNIQUE(session_id, member_id)
    )
  `;
}
