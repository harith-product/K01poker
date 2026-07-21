export type GameType = 'online' | 'offline';

export interface SessionRow {
  buy_in_amount: number | string;
  chip_ratio: number | string;
  is_custom_ratio: boolean;
  custom_cash_amount?: number | string | null;
  custom_chip_amount?: number | string | null;
}

export interface MemberRow {
  buy_ins: number | string;
  chips_left?: number | string | null;
  chip_pnl?: number | string | null;
  member_name: string;
}

export function chipsPerBuyIn(session: SessionRow): number {
  const buyIn = Number(session.buy_in_amount);
  if (session.is_custom_ratio && session.custom_cash_amount && session.custom_chip_amount) {
    return (Number(session.custom_chip_amount) / Number(session.custom_cash_amount)) * buyIn;
  }
  return buyIn * Number(session.chip_ratio);
}

export function chipsToCash(session: SessionRow, chips: number): number {
  if (session.is_custom_ratio && session.custom_cash_amount && session.custom_chip_amount) {
    return chips * (Number(session.custom_cash_amount) / Number(session.custom_chip_amount));
  }
  return chips / Number(session.chip_ratio);
}

export function chipToMoneyRate(session: SessionRow): number {
  if (session.is_custom_ratio && session.custom_cash_amount && session.custom_chip_amount) {
    return Number(session.custom_cash_amount) / Number(session.custom_chip_amount);
  }
  return 1 / Number(session.chip_ratio);
}

/** Offline gross P&L (zero-sum). */
export function offlineGrossPnl(session: SessionRow, member: MemberRow): number {
  const chipsLeft = Number(member.chips_left ?? 0);
  const buyIns = Number(member.buy_ins);
  const cashValue = chipsToCash(session, chipsLeft);
  return cashValue - buyIns * Number(session.buy_in_amount);
}

/** Offline balance change (10% rake on winners). */
export function offlineBalancePnl(grossPnl: number): number {
  return grossPnl > 0 ? grossPnl * 0.9 : grossPnl;
}

export function offlineRakeFromGross(grossPnl: number): number {
  return grossPnl > 0 ? grossPnl * 0.1 : 0;
}

/** Online money P&L from chip P&L. */
export function onlineMoneyPnl(session: SessionRow, chipPnl: number): number {
  return chipPnl * chipToMoneyRate(session);
}
