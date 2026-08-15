import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db';
import { adjustBalance } from './_balances';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method === 'POST') {
    const { playerName, amount, direction, notes, recordedBy } = req.body;
    if (!playerName || !amount || !direction) return res.status(400).json({ error: 'missing fields' });
    const delta = direction === 'player_paid_house' ? Number(amount) : -Number(amount);

    await sql`
      INSERT INTO settlements (player_name, amount, direction, mode, notes, recorded_by)
      VALUES (${playerName}, ${amount}, ${direction}, 'net', ${notes ?? null}, ${recordedBy ?? null})
    `;
    await adjustBalance(playerName, delta);

    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const [row] = await sql`
      SELECT player_name, amount, direction FROM settlements WHERE id = ${id}
    `;
    if (!row) return res.status(404).json({ error: 'not found' });

    const delta = row.direction === 'player_paid_house' ? -Number(row.amount) : Number(row.amount);
    await adjustBalance(row.player_name as string, delta);
    await sql`DELETE FROM settlements WHERE id = ${id}`;

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
