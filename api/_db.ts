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

  await sql`
    CREATE TABLE IF NOT EXISTS initial_balances (
      player_name TEXT PRIMARY KEY,
      amount      NUMERIC NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settlements (
      id          SERIAL PRIMARY KEY,
      player_name TEXT NOT NULL,
      amount      NUMERIC NOT NULL,
      direction   TEXT NOT NULL,
      notes       TEXT,
      recorded_by TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed initial balance snapshot (runs once — ON CONFLICT DO NOTHING)
  const seed: [string, number][] = [
    // Players owe house (negative = player owes)
    ['Ankur', -17390.5], ['Yatin', -15460.25], ['Unaccounted', -12999.25],
    ['Subhinav', -7000], ['Sushant', -6346.75], ['Jishnu', -3513.5],
    ['Yash', -2542.5], ['Saket', -2537.75], ['Ashish', -2341],
    ['Shiva', -2340.5], ['Yashvardhan', -1142.5], ['Harith', -1000.25],
    ['Harshita', -804.5], ['Shikha', -687.5], ['Kavish', -654.5],
    ['Alok', -597], ['Richa', -500], ['Shubham', -500],
    ['Sawrav', -362.75], ['Saurabh', -250], ['Ishan', -102.25],
    ['Aman', -61.75], ['Pawan', -11.75],
    // House owes players (positive = house owes)
    ['Ankit', 39953], ['Kislay', 24937.25], ['Mansi', 6893],
    ['Abhinav', 5849.25], ['Kshitij', 2201], ['Mac', 1800],
    ['Sam', 1025.75], ['Rohit', 366.75], ['Vikas', 281.25],
    ['Akshay', 206.75], ['Sid', 119.5], ['Prashant', 66],
    ['Pallavi', 15.25], ['Dvij', 12.75], ['Amey', 9],
  ];
  for (const [name, amount] of seed) {
    await sql`
      INSERT INTO initial_balances (player_name, amount)
      VALUES (${name}, ${amount})
      ON CONFLICT (player_name) DO NOTHING
    `;
  }
}
