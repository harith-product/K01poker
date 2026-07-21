import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const connectionString = process.env.DATABASE_URL;
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

// Neon serverless driver for production; postgres.js for local Docker Postgres
export const sql = isLocal
  ? postgres(connectionString)
  : neon(connectionString);

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

  await sql`
    CREATE TABLE IF NOT EXISTS settlements (
      id          SERIAL PRIMARY KEY,
      player_name TEXT NOT NULL,
      amount      NUMERIC NOT NULL,
      direction   TEXT NOT NULL,
      mode        TEXT NOT NULL DEFAULT 'offline',
      notes       TEXT,
      recorded_by TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE settlements
    ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'offline'
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS player_balances (
      player_name TEXT NOT NULL,
      mode        TEXT NOT NULL,
      amount      NUMERIC NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (player_name, mode)
    )
  `;

  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'offline'`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT 'Main'`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS rake_amount NUMERIC`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin'`;

  await sql`ALTER TABLE session_members ADD COLUMN IF NOT EXISTS chip_pnl NUMERIC`;
  await sql`ALTER TABLE session_members ADD COLUMN IF NOT EXISTS gross_pnl NUMERIC`;
  await sql`ALTER TABLE session_members ADD COLUMN IF NOT EXISTS balance_pnl NUMERIC`;
}
