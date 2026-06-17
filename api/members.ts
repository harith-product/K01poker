import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method === 'GET') {
    const rows = await sql`SELECT id, name FROM members ORDER BY created_at ASC`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const id = `m${Date.now()}`;
    const [row] = await sql`INSERT INTO members (id, name) VALUES (${id}, ${name}) RETURNING id, name`;
    return res.status(201).json(row);
  }

  if (req.method === 'PATCH') {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    const [row] = await sql`UPDATE members SET name = ${name} WHERE id = ${id} RETURNING id, name`;
    if (!row) return res.status(404).json({ error: 'member not found' });
    return res.status(200).json(row);
  }

  return res.status(405).json({ error: 'method not allowed' });
}
