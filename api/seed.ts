import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db';

const INITIAL_MEMBERS = [
  { id: 'm1', name: 'Ankur' },
  { id: 'm2', name: 'Harith' },
  { id: 'm3', name: 'Pallavi' },
  { id: 'm4', name: 'Jishnu' },
  { id: 'm5', name: 'Harshita' },
  { id: 'm6', name: 'Kisley' },
  { id: 'm7', name: 'Aman' },
  { id: 'm8', name: 'Sushant' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  await initSchema();
  for (const m of INITIAL_MEMBERS) {
    await sql`INSERT INTO members (id, name) VALUES (${m.id}, ${m.name}) ON CONFLICT (id) DO NOTHING`;
  }
  return res.status(200).json({ ok: true, seeded: INITIAL_MEMBERS.length });
}
