export interface ParsedSession {
  date: string;
  session: string;
  players: Record<string, number>;
}

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

export function parseDate(raw: string): string {
  if (!raw || raw.trim() === '') return '';
  const short = raw.trim().match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (short) {
    const [, day, mon] = short;
    return `${new Date().getFullYear()}-${MONTHS[mon] ?? '01'}-${day.padStart(2, '0')}`;
  }
  const long = raw.trim().match(/^(\d{1,2})\s([A-Za-z]{3})\s(\d{4})$/);
  if (long) {
    const [, day, mon, year] = long;
    return `${year}-${MONTHS[mon] ?? '01'}-${day.padStart(2, '0')}`;
  }
  return raw.trim();
}

export function parseAmount(val: string): number {
  if (!val || val.trim() === '' || val.trim() === '0') return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
}

export function parseCSVRow(row: string): string[] {
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

/** Standard format: row 0 = Date, Session, player1, player2, ... */
export function parseStandardCSV(
  text: string,
  sessionFilter?: (s: string) => string,
): ParsedSession[] {
  const rows = text.split('\n').map(parseCSVRow);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const playerCols = headers.slice(2)
    .map((name, idx) => ({ name, colIdx: idx + 2 }))
    .filter(({ name }) => name !== '');

  const sessions: ParsedSession[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]?.trim()) continue;
    const date = parseDate(row[0]);
    const rawSession = row[1] || '';
    const session = sessionFilter ? sessionFilter(rawSession) : rawSession;
    const players: Record<string, number> = {};
    for (const { name, colIdx } of playerCols) {
      players[name] = parseAmount(row[colIdx] ?? '');
    }
    sessions.push({ date, session, players });
  }
  return sessions;
}

/** Transposed format: row 0 = Player, date1, date2... */
export function parseTransposedCSV(text: string): ParsedSession[] {
  const rows = text.split('\n').map(parseCSVRow);
  if (rows.length < 2) return [];

  const sessionHeaders = rows[0].slice(1);
  const sessionMeta = sessionHeaders.map(h => {
    const m = h.trim().match(/^(\d{1,2}-[A-Za-z]{3})\s*(.*)$/);
    return { date: m ? parseDate(m[1]) : h.trim(), session: m ? m[2].trim() : '' };
  });

  const sessions: ParsedSession[] = sessionMeta.map(s => ({ ...s, players: {} }));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const playerName = row[0]?.trim();
    if (!playerName) continue;
    sessionHeaders.forEach((_, si) => {
      sessions[si].players[playerName] = parseAmount(row[si + 1] ?? '');
    });
  }

  return sessions.filter(s => Object.values(s.players).some(v => v !== 0));
}
