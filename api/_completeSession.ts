import { sql } from './_db';
import { adjustBalance } from './_balances';
import {
  chipsPerBuyIn,
  offlineGrossPnl,
  offlineBalancePnl,
  offlineRakeFromGross,
  onlineMoneyPnl,
  type SessionRow,
  type MemberRow,
} from './_sessionMath';

export interface CompletedMember {
  memberId: string;
  memberName: string;
  grossPnl: number;
  balancePnl: number;
}

export interface CompleteSessionResult {
  members: CompletedMember[];
  rake: number;
}

export async function completeOfflineSession(
  sessionId: string,
  memberChips: { memberId: string; chipsLeft: number }[],
): Promise<CompleteSessionResult> {
  const [session] = await sql`
    SELECT * FROM sessions WHERE id = ${sessionId} AND is_active = TRUE
  `;
  if (!session) throw new Error('Session not found or already ended');

  const memberRows = await sql`
    SELECT sm.*, m.name AS member_name
    FROM session_members sm
    JOIN members m ON m.id = sm.member_id
    WHERE sm.session_id = ${sessionId}
  `;

  const chipsMap = new Map(memberChips.map(mc => [mc.memberId, mc.chipsLeft]));
  const sessionRow = session as unknown as SessionRow;

  let totalChipsIn = 0;
  for (const m of memberRows) {
    totalChipsIn += Number(m.buy_ins) * chipsPerBuyIn(sessionRow);
  }
  const totalChipsOut = memberChips.reduce((s, mc) => s + mc.chipsLeft, 0);
  if (Math.round(totalChipsIn) !== Math.round(totalChipsOut)) {
    throw new Error('Chips cashed out must equal chips dealt');
  }

  const completed: CompletedMember[] = [];
  let totalRake = 0;

  for (const m of memberRows) {
    const chipsLeft = chipsMap.get(m.member_id as string);
    if (chipsLeft === undefined) throw new Error('Missing chips for a member');

    const memberRow: MemberRow = {
      buy_ins: m.buy_ins,
      chips_left: chipsLeft,
      member_name: m.member_name as string,
    };
    const gross = offlineGrossPnl(sessionRow, memberRow);
    const balance = offlineBalancePnl(gross);
    const rake = offlineRakeFromGross(gross);
    totalRake += rake;

    await sql`
      UPDATE session_members
      SET chips_left = ${chipsLeft}, gross_pnl = ${gross}, balance_pnl = ${balance}
      WHERE session_id = ${sessionId} AND member_id = ${m.member_id}
    `;
    await adjustBalance(m.member_name as string, balance);

    completed.push({
      memberId: m.member_id as string,
      memberName: m.member_name as string,
      grossPnl: gross,
      balancePnl: balance,
    });
  }

  await sql`
    UPDATE sessions SET is_active = FALSE, rake_amount = ${totalRake}, completed_at = NOW(), source = 'admin'
    WHERE id = ${sessionId}
  `;

  return { members: completed, rake: totalRake };
}

export async function completeOnlineSession(
  sessionId: string,
  memberChipPnl: { memberId: string; chipPnl: number }[],
): Promise<CompleteSessionResult> {
  const [session] = await sql`
    SELECT * FROM sessions WHERE id = ${sessionId} AND is_active = TRUE
  `;
  if (!session) throw new Error('Session not found or already ended');

  const memberRows = await sql`
    SELECT sm.*, m.name AS member_name
    FROM session_members sm
    JOIN members m ON m.id = sm.member_id
    WHERE sm.session_id = ${sessionId}
  `;

  const pnlMap = new Map(memberChipPnl.map(mc => [mc.memberId, mc.chipPnl]));
  const sessionRow = session as unknown as SessionRow;

  const completed: CompletedMember[] = [];
  let moneySum = 0;

  for (const m of memberRows) {
    const chipPnl = pnlMap.get(m.member_id as string);
    if (chipPnl === undefined) throw new Error('Missing P&L for a member');

    const moneyPnl = onlineMoneyPnl(sessionRow, chipPnl);
    moneySum += moneyPnl;

    await sql`
      UPDATE session_members
      SET chip_pnl = ${chipPnl}, gross_pnl = ${moneyPnl}, balance_pnl = ${moneyPnl}
      WHERE session_id = ${sessionId} AND member_id = ${m.member_id}
    `;
    await adjustBalance(m.member_name as string, moneyPnl);

    completed.push({
      memberId: m.member_id as string,
      memberName: m.member_name as string,
      grossPnl: moneyPnl,
      balancePnl: moneyPnl,
    });
  }

  if (moneySum > 0) {
    throw new Error('Total P&L cannot be positive. Current sum: ' + moneySum.toFixed(2));
  }

  const rake = moneySum < 0 ? Math.abs(moneySum) : 0;

  await sql`
    UPDATE sessions SET is_active = FALSE, rake_amount = ${rake}, completed_at = NOW(), source = 'admin'
    WHERE id = ${sessionId}
  `;

  return { members: completed, rake };
}
