import type { Player, GameSession, BalanceData } from './types';

// The Google Sheet must be published to the web as CSV (File > Share > Publish to web > CSV)
// Set this to your published CSV URL
const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL || '';
const BALANCE_CSV_URL = import.meta.env.VITE_BALANCE_CSV_URL || '';
const OFFLINE_CSV_URL = import.meta.env.VITE_OFFLINE_CSV_URL || '';
const TOURNAMENT_CSV_URL = import.meta.env.VITE_TOURNAMENT_CSV_URL || '';

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function parseDate(raw: string): string {
  // "04-Jun" → "2026-06-04"
  if (!raw || raw.trim() === '') return '';
  const short = raw.trim().match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (short) {
    const [, day, mon] = short;
    return `${new Date().getFullYear()}-${MONTHS[mon] ?? '01'}-${day.padStart(2, '0')}`;
  }
  // "14 Nov 2025" → "2025-11-14"
  const long = raw.trim().match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{4})$/);
  if (long) {
    const [, day, mon, year] = long;
    return `${year}-${MONTHS[mon] ?? '01'}-${day.padStart(2, '0')}`;
  }
  return raw.trim();
}

function parseAmount(val: string): number {
  if (!val || val.trim() === '' || val.trim() === '0') return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
}

function parseCSVRow(row: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuote = false;
  for (const ch of row) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  cells.push(cur.trim());
  return cells;
}

async function parseSheetCSV(url: string, sessionFilter?: (s: string) => string, source?: 'online' | 'offline'): Promise<{ players: Player[]; sessions: GameSession[] }> {
  if (!url) return { players: [], sessions: [] };

  const resp = await fetch(url);
  const text = await resp.text();

  const rows = text.split('\n').map(parseCSVRow);

  if (rows.length < 2) return { players: [], sessions: [] };

  // Row 0 is headers: Date, Session, player1, player2, ...
  const headers = rows[0];
  // Preserve original column index so empty header gaps don't shift data reads
  const playerCols = headers.slice(2)
    .map((name, idx) => ({ name, colIdx: idx + 2 }))
    .filter(({ name }) => name !== '');
  const playerNames = playerCols.map(p => p.name);

  const sessions: GameSession[] = [];
  const playerResultsMap: Record<string, { date: string; session: string; amount: number }[]> = {};

  playerNames.forEach(name => { playerResultsMap[name] = []; });

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || row[0] === '') continue;

    const date = parseDate(row[0]);
    const rawSession = row[1] || '';
    const session = sessionFilter ? sessionFilter(rawSession) : rawSession;
    const playerPnL: Record<string, number> = {};

    playerCols.forEach(({ name, colIdx }) => {
      const amount = parseAmount(row[colIdx]);
      playerPnL[name] = amount;
      if (amount !== 0) {
        playerResultsMap[name].push({ date, session, amount, ...(source ? { source } : {}) });
      }
    });

    sessions.push({ date, session, players: playerPnL });
  }

  const players: Player[] = playerNames
    .map(name => {
      const results = playerResultsMap[name];
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
    })
    .filter(p => p.gamesPlayed > 0);

  return { players, sessions };
}

const BACKGROUND_REFRESH_TTL = 10 * 60 * 1000; // refresh in background after 10 min

function readCache<T>(key: string): { data: T; stale: boolean } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data: data as T, stale: Date.now() - ts > BACKGROUND_REFRESH_TTL };
  } catch { return null; }
}

function writeCache(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

type SheetResult = { players: Player[]; sessions: GameSession[] };

async function fetchWithCache(key: string, fetcher: () => Promise<SheetResult>): Promise<SheetResult> {
  const cached = readCache<SheetResult>(key);
  if (cached) {
    // Always serve cache instantly; refresh in background only if stale
    if (cached.stale) fetcher().then(fresh => writeCache(key, fresh)).catch(() => {});
    return cached.data;
  }
  const fresh = await fetcher();
  writeCache(key, fresh);
  return fresh;
}

export async function fetchSheetData() {
  return fetchWithCache('cache_online', () => parseSheetCSV(SHEET_CSV_URL, undefined, 'online'));
}

// Transposed format: row 0 = headers (Player, date1, date2...), rows 1+ = players
async function parseTransposedSheetCSV(url: string, source?: 'online' | 'offline'): Promise<{ players: Player[]; sessions: GameSession[] }> {
  if (!url) return { players: [], sessions: [] };
  const resp = await fetch(url);
  const text = await resp.text();
  const rows = text.split('\n').map(parseCSVRow);
  if (rows.length < 2) return { players: [], sessions: [] };

  const sessionHeaders = rows[0].slice(1);
  const sessionMeta = sessionHeaders.map(h => {
    const m = h.trim().match(/^(\d{1,2}-[A-Za-z]{3})\s*(.*)$/);
    return { date: m ? parseDate(m[1]) : h.trim(), session: m ? m[2].trim() : '' };
  });

  const sessions: GameSession[] = sessionMeta.map(s => ({ ...s, players: {} }));
  const playerResultsMap: Record<string, { date: string; session: string; amount: number; source?: 'online' | 'offline' }[]> = {};
  const playerNames: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const playerName = row[0]?.trim();
    if (!playerName) continue;
    playerNames.push(playerName);
    playerResultsMap[playerName] = [];
    sessionHeaders.forEach((_, si) => {
      const amount = parseAmount(row[si + 1] ?? '');
      sessions[si].players[playerName] = amount;
      if (amount !== 0) {
        playerResultsMap[playerName].push({ date: sessionMeta[si].date, session: sessionMeta[si].session, amount, ...(source ? { source } : {}) });
      }
    });
  }

  const players: Player[] = playerNames.map(name => {
    const results = playerResultsMap[name];
    const totalWinnings = results.reduce((s, r) => s + r.amount, 0);
    const gamesPlayed = results.length;
    const amounts = results.map(r => r.amount);
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name, results, totalWinnings, gamesPlayed,
      avgPerGame: gamesPlayed > 0 ? Math.round(totalWinnings / gamesPlayed) : 0,
      bestResult: amounts.length > 0 ? Math.max(...amounts) : 0,
      worstResult: amounts.length > 0 ? Math.min(...amounts) : 0,
    };
  }).filter(p => p.gamesPlayed > 0);

  return { players, sessions: sessions.filter(s => Object.values(s.players).some(v => v !== 0)) };
}

export async function fetchTournamentData() {
  return fetchWithCache('cache_tournament', () => parseTransposedSheetCSV(TOURNAMENT_CSV_URL, 'online'));
}

export async function fetchOfflineSheetData() {
  return fetchWithCache('cache_offline', () => parseSheetCSV(OFFLINE_CSV_URL, s => (s === '1' ? '' : s), 'offline'));
}

async function fetchBalanceRaw(): Promise<BalanceData> {
  if (!BALANCE_CSV_URL) return { owesHouse: [], houseOwes: [] };

  const resp = await fetch(BALANCE_CSV_URL);
  const text = await resp.text();

  // Parse CSV rows, handling quoted values like "1,000.00"
  const rows = text.split('\n').slice(1); // skip header

  const owesHouse: BalanceData['owesHouse'] = [];
  const houseOwes: BalanceData['houseOwes'] = [];

  rows.forEach(row => {
    // Split respecting quoted commas
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of row) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());

    const oweName = cols[0]?.trim();
    const oweAmt = parseAmount(cols[1] ?? '');
    const houseName = cols[2]?.trim();
    const houseAmt = parseAmount(cols[3] ?? '');

    if (oweName) owesHouse.push({ name: oweName, amount: oweAmt });
    if (houseName) houseOwes.push({ name: houseName, amount: houseAmt });
  });

  return { owesHouse, houseOwes };
}

export async function fetchBalanceData(): Promise<BalanceData> {
  const cached = readCache<BalanceData>('cache_balance');
  if (cached) {
    if (cached.stale) fetchBalanceRaw().then(fresh => writeCache('cache_balance', fresh)).catch(() => {});
    return cached.data;
  }
  const fresh = await fetchBalanceRaw();
  writeCache('cache_balance', fresh);
  return fresh;
}
