import { sql } from './_db';

export const BALANCE_MODE = 'net';

/** Merge legacy offline/online rows into a single net balance per player. */
export async function migrateLegacyBalances() {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM player_balances WHERE mode IN ('offline', 'online')
  `;
  if (count === 0) return;

  const summed = await sql`
    SELECT player_name, SUM(amount) AS amount
    FROM player_balances
    GROUP BY player_name
    HAVING ABS(SUM(amount)) >= 0.01
  `;

  await sql`DELETE FROM player_balances`;
  for (const row of summed) {
    await sql`
      INSERT INTO player_balances (player_name, mode, amount)
      VALUES (${row.player_name as string}, ${BALANCE_MODE}, ${row.amount})
    `;
  }
}

export async function adjustBalance(playerName: string, delta: number) {
  if (Math.abs(delta) < 0.0001) return;
  await sql`
    INSERT INTO player_balances (player_name, mode, amount)
    VALUES (${playerName}, ${BALANCE_MODE}, ${delta})
    ON CONFLICT (player_name, mode)
    DO UPDATE SET amount = player_balances.amount + EXCLUDED.amount, updated_at = NOW()
  `;
}

export async function getBalances(): Promise<{ playerName: string; amount: number }[]> {
  await migrateLegacyBalances();
  const rows = await sql`
    SELECT player_name, amount FROM player_balances
    WHERE mode = ${BALANCE_MODE} AND ABS(amount) >= 0.01
    ORDER BY ABS(amount) DESC
  `;
  return rows.map(r => ({ playerName: r.player_name as string, amount: Number(r.amount) }));
}
