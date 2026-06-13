import type { Player, GameSession, BalanceData } from './types';

// The Google Sheet must be published to the web as CSV (File > Share > Publish to web > CSV)
// Set this to your published CSV URL
const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL || '';
const BALANCE_CSV_URL = import.meta.env.VITE_BALANCE_CSV_URL || '';

function parseDate(raw: string): string {
  // Normalize dates like "04-Jun", "4-Jun", etc. → "2025-06-04"
  if (!raw || raw.trim() === '') return '';
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const match = raw.trim().match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (!match) return raw.trim();
  const [, day, mon] = match;
  const year = new Date().getFullYear();
  return `${year}-${months[mon] ?? '01'}-${day.padStart(2, '0')}`;
}

function parseAmount(val: string): number {
  if (!val || val.trim() === '' || val.trim() === '0') return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
}

export async function fetchSheetData(): Promise<{ players: Player[]; sessions: GameSession[] }> {
  if (!SHEET_CSV_URL) {
    return { players: [], sessions: [] };
  }

  const resp = await fetch(SHEET_CSV_URL);
  const text = await resp.text();

  const rows = text.split('\n').map(r =>
    r.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
  );

  if (rows.length < 2) return { players: [], sessions: [] };

  // Row 0 is headers: Date, Session, player1, player2, ...
  const headers = rows[0];
  const playerNames = headers.slice(2).filter(h => h !== '');

  const sessions: GameSession[] = [];
  const playerResultsMap: Record<string, { date: string; session: string; amount: number }[]> = {};

  playerNames.forEach(name => { playerResultsMap[name] = []; });

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || row[0] === '') continue;

    const date = parseDate(row[0]);
    const session = row[1] || '';
    const playerPnL: Record<string, number> = {};

    playerNames.forEach((name, idx) => {
      const amount = parseAmount(row[idx + 2]);
      playerPnL[name] = amount;
      if (amount !== 0) {
        playerResultsMap[name].push({ date, session, amount });
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

export async function fetchBalanceData(): Promise<BalanceData> {
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
