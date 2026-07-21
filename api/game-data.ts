import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initSchema } from './_db';
import { getGameDataFromDb } from './_gameData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const type = (req.query.type as string) || 'offline';
  if (!['online', 'offline', 'tournament', 'offline_tournament'].includes(type)) {
    return res.status(400).json({ error: 'type must be online, offline, tournament, or offline_tournament' });
  }

  const data = await getGameDataFromDb(type as 'online' | 'offline' | 'tournament' | 'offline_tournament');
  return res.status(200).json(data);
}
