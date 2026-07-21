import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db.js';

const RAKE_INITIAL = 69571.25;

const BALANCE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRH49eJ069HcnDBMlWKTpnnVBJykUINISs34U9a5DDtv7BwvmCK4UasLbbR-UU3tgHQIz6X24nf9xc8/pub?gid=1461471471&single=true&output=csv';

const NAME_MAP: Record<string, string> = {
  'ankur1997': 'Ankur',
  'Knight@09': 'Sam',
  'abhinav7': 'Abhinav',
  'Harith Gowda': 'Harith',
  'Subhinav': 'Subhinav',
  'Pwn007': 'Pawan',
  'DEEDU': 'Alok',
  'DJ Saket': 'Saket',
  'MoriartyKD': 'Kislay',
  'tintin0007': 'Yatin',
  'Anne11': 'Ananya',
  'Killfreak': 'Sushant',
  'AnX007': 'Ankit',
  'Jmrj': 'Jishnu',
  'm02dd': 'Ashish',
  'calcrohit': 'Rohit',
  'OGGareeb': 'Akhil',
  'sbjwinner': 'Sanjana',
  'Manseyyyy': 'Mansi',
  'f51-dd': 'Shiva',
  'BluffMaster2301': 'Kshitij',
  'KS@cypher': 'Kavish',
  'Uchiha Aman': 'Aman',
  'Ghost@KS': 'Kavish',
  'D.J Saket': 'Saket',
  'FT_SSS': 'Shiva',
};

function dn(name: string): string {
  return NAME_MAP[name] ?? name;
}

function parseAmt(val: string): number {
  if (!val || val.trim() === '' || val.trim() === '0') return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
}

async function fetchSheetBalances(): Promise<{ playerName: string; amount: number }[]> {
  try {
    const resp = await fetch(BALANCE_CSV_URL);
    const text = await resp.text();
    const rows = text.split('\n').slice(1); // skip header row
    const result: { playerName: string; amount: number }[] = [];
    for (const row of rows) {
      const cols: string[] = [];
      let cur = '', inQuote = false;
      for (const ch of row) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      // Col A/B: player owes house → negative balance
      const oweName = cols[0]?.trim();
      const oweAmt = parseAmt(cols[1] ?? '');
      // Col C/D: house owes player → positive balance
      const houseName = cols[2]?.trim();
      const houseAmt = parseAmt(cols[3] ?? '');
      if (oweName && oweAmt !== 0) result.push({ playerName: dn(oweName), amount: -Math.abs(oweAmt) });
      if (houseName && houseAmt !== 0) result.push({ playerName: dn(houseName), amount: Math.abs(houseAmt) });
    }
    return result;
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const [sheetBalances, sessionRows, settlementRows] = await Promise.all([
    fetchSheetBalances(),
    sql`
      SELECT s.buy_in_amount, s.chip_ratio, s.is_custom_ratio,
             s.custom_cash_amount, s.custom_chip_amount,
             sm.buy_ins, sm.chips_left,
             m.name AS member_name
      FROM sessions s
      JOIN session_members sm ON sm.session_id = s.id
      JOIN members m ON m.id = sm.member_id
      WHERE s.is_active = FALSE AND sm.chips_left IS NOT NULL
    `,
    sql`SELECT id, player_name, amount, direction, notes, recorded_by, created_at FROM settlements ORDER BY created_at DESC`,
  ]);

  // P&L per player from admin (offline) sessions, with 10% rake on winners
  const sessionPnL: Record<string, { netPnl: number; rake: number }> = {};
  for (const r of sessionRows) {
    const buyInAmount = Number(r.buy_in_amount);
    const chipRatio = Number(r.chip_ratio);
    const chipsLeft = Number(r.chips_left);
    const buyIns = Number(r.buy_ins);
    const cashValue = r.is_custom_ratio && r.custom_cash_amount && r.custom_chip_amount
      ? chipsLeft * (Number(r.custom_cash_amount) / Number(r.custom_chip_amount))
      : chipsLeft / chipRatio;
    const pnl = cashValue - buyIns * buyInAmount;
    const rake = pnl > 0 ? pnl * 0.1 : 0;
    const netPnl = pnl > 0 ? pnl * 0.9 : pnl;
    const name = r.member_name as string;
    if (!sessionPnL[name]) sessionPnL[name] = { netPnl: 0, rake: 0 };
    sessionPnL[name].netPnl += netPnl;
    sessionPnL[name].rake += rake;
  }

  const totalRakeNew = Object.values(sessionPnL).reduce((s, v) => s + v.rake, 0);

  return res.status(200).json({
    initialBalances: sheetBalances,
    sessionPnL: Object.entries(sessionPnL).map(([playerName, v]) => ({ playerName, netPnl: v.netPnl, rake: v.rake })),
    settlements: settlementRows.map(r => ({
      id: r.id,
      playerName: r.player_name as string,
      amount: Number(r.amount),
      direction: r.direction as string,
      notes: r.notes as string | null,
      recordedBy: r.recorded_by as string | null,
      createdAt: r.created_at,
    })),
    totalRakeInitial: RAKE_INITIAL,
    totalRakeNew,
  });
}
