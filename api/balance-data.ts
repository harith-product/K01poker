import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db';
import { getBalances } from './_balances';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const [balances, settlementRows] = await Promise.all([
    getBalances(),
    sql`SELECT id, player_name, amount, direction, mode, notes, recorded_by, created_at FROM settlements ORDER BY created_at DESC`,
  ]);

  return res.status(200).json({
    balances,
    settlements: settlementRows.map(r => ({
      id: r.id,
      playerName: r.player_name as string,
      amount: Number(r.amount),
      direction: r.direction as string,
      notes: r.notes as string | null,
      recordedBy: r.recorded_by as string | null,
      createdAt: r.created_at,
    })),
  });
}
