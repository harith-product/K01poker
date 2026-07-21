import { sql } from './_db';
import { displayName } from './_displayNames';

export interface PlayerResult {
  date: string;
  session: string;
  amount: number;
  source?: 'online' | 'offline';
}

export interface GamePlayer {
  id: string;
  name: string;
  results: PlayerResult[];
  totalWinnings: number;
  gamesPlayed: number;
  avgPerGame: number;
  bestResult: number;
  worstResult: number;
}

export interface GameSession {
  date: string;
  session: string;
  players: Record<string, number>;
}

function formatDateISO(date: unknown): string {
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  const s = String(date);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return s;
}

export async function getGameDataFromDb(
  gameType: 'online' | 'offline' | 'tournament' | 'offline_tournament',
): Promise<{ players: GamePlayer[]; sessions: GameSession[] }> {
  const rows = await sql`
    SELECT s.id, s.date, s.session_name, m.name AS player_name, sm.gross_pnl
    FROM sessions s
    JOIN session_members sm ON sm.session_id = s.id
    JOIN members m ON m.id = sm.member_id
    WHERE s.is_active = FALSE
      AND s.game_type = ${gameType}
      AND sm.gross_pnl IS NOT NULL
    ORDER BY s.date ASC, s.created_at ASC
  `;

  const sessionMap = new Map<string, GameSession>();
  const playerResultsMap: Record<string, PlayerResult[]> = {};
  const source = gameType === 'offline' ? 'offline' : 'online';

  for (const r of rows) {
    const sessionId = r.id as string;
    const date = formatDateISO(r.date);
    const sessionName = (r.session_name as string) || '';
    const playerName = r.player_name as string;
    const amount = Number(r.gross_pnl);

    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, { date, session: sessionName, players: {} });
    }
    sessionMap.get(sessionId)!.players[playerName] = amount;

    if (amount !== 0) {
      if (!playerResultsMap[playerName]) playerResultsMap[playerName] = [];
      playerResultsMap[playerName].push({ date, session: sessionName, amount, source });
    }
  }

  const sessions = [...sessionMap.values()];
  const players: GamePlayer[] = Object.entries(playerResultsMap).map(([name, results]) => {
    const totalWinnings = results.reduce((s, r) => s + r.amount, 0);
    const gamesPlayed = results.length;
    const amounts = results.map(r => r.amount);
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name,
      results,
      totalWinnings,
      gamesPlayed,
      avgPerGame: gamesPlayed > 0 ? Math.round(totalWinnings / gamesPlayed) : 0,
      bestResult: amounts.length > 0 ? Math.max(...amounts) : 0,
      worstResult: amounts.length > 0 ? Math.min(...amounts) : 0,
    };
  }).filter(p => p.gamesPlayed > 0);

  return { players, sessions };
}

async function ensureMember(name: string): Promise<string> {
  const canonical = displayName(name);
  const [existing] = await sql`SELECT id FROM members WHERE name = ${canonical}`;
  if (existing) return existing.id as string;
  const id = `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  await sql`INSERT INTO members (id, name) VALUES (${id}, ${canonical})`;
  return id;
}

export async function importSessionsToDb(
  gameType: 'online' | 'offline' | 'tournament' | 'offline_tournament',
  parsed: { date: string; session: string; players: Record<string, number> }[],
): Promise<{ imported: number }> {
  let count = 0;
  for (const row of parsed) {
    if (!row.date) continue;
    const id = `import_${gameType}_${Date.now()}_${count}`;
    await sql`
      INSERT INTO sessions (id, date, buy_in_amount, chip_ratio, is_custom_ratio, is_active, game_type, session_name, source, completed_at)
      VALUES (${id}, ${row.date}, 0, 1, FALSE, FALSE, ${gameType}, ${row.session || 'Main'}, 'import', NOW())
    `;

    for (const [rawName, grossPnl] of Object.entries(row.players)) {
      if (grossPnl === 0) continue;
      const memberId = await ensureMember(rawName);
      const balancePnl = gameType === 'offline' && grossPnl > 0 ? grossPnl * 0.9 : grossPnl;
      await sql`
        INSERT INTO session_members (session_id, member_id, buy_ins, gross_pnl, balance_pnl)
        VALUES (${id}, ${memberId}, 0, ${grossPnl}, ${balancePnl})
      `;
    }
    count++;
  }
  return { imported: count };
}
