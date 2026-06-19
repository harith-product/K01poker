import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method === 'POST') {
    const { playerName, amount, direction, notes, recordedBy } = req.body;
    if (!playerName || !amount || !direction) return res.status(400).json({ error: 'missing fields' });
    await sql`
      INSERT INTO settlements (player_name, amount, direction, notes, recorded_by)
      VALUES (${playerName}, ${amount}, ${direction}, ${notes ?? null}, ${recordedBy ?? null})
    `;
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    await sql`DELETE FROM settlements WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
