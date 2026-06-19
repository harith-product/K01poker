import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initSchema } from './_db.js';

const RAKE_INITIAL = 69571.25; // snapshot rake already collected

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initSchema();

  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const [initialRows, sessionRows, settlementRows] = await Promise.all([
    sql`SELECT player_name, amount FROM initial_balances`,
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
    initialBalances: initialRows.map(r => ({ playerName: r.player_name as string, amount: Number(r.amount) })),
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
