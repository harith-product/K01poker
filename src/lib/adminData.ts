export type GameType = 'online' | 'offline' | 'tournament' | 'offline_tournament';

export function gameTypeLabel(gameType: GameType): string {
  switch (gameType) {
    case 'offline': return 'Offline Cash';
    case 'online': return 'Online Cash';
    case 'tournament': return 'Online Tournament';
    case 'offline_tournament': return 'Offline Tournament';
  }
}

export function isChipPnlSession(gameType: GameType): boolean {
  return gameType === 'online' || gameType === 'tournament' || gameType === 'offline_tournament';
}

export interface Member {
  id: string;
  name: string;
}

export interface SessionMember {
  memberId: string;
  buyIns: number;
  chipsLeft: number | null;
  chipPnl?: number | null;
  grossPnl?: number | null;
  balancePnl?: number | null;
}

export interface Session {
  id: string;
  date: string;
  gameType: GameType;
  sessionName: string;
  buyInAmount: number;
  chipRatio: number;
  isCustomRatio: boolean;
  customCashAmount?: number;
  customChipAmount?: number;
  members: SessionMember[];
  isActive: boolean;
  rakeAmount?: number;
}

export interface CompleteSessionResult {
  members: { memberId: string; memberName: string; grossPnl: number; balancePnl: number }[];
  rake: number;
}

const BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'API error');
  }
  return res.json();
}

export async function getMembers(): Promise<Member[]> {
  return apiFetch<Member[]>('/members');
}

export async function addMember(name: string): Promise<Member> {
  return apiFetch<Member>('/members', { method: 'POST', body: JSON.stringify({ name }) });
}

export async function updateMemberName(id: string, name: string): Promise<void> {
  await apiFetch('/members', { method: 'PATCH', body: JSON.stringify({ id, name }) });
}

export async function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>('/sessions');
}

export async function getActiveSessions(): Promise<Session[]> {
  const sessions = await getSessions();
  return sessions.filter(s => s.isActive);
}

export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  const { id } = await apiFetch<{ id: string }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return { ...session, id };
}

async function sessionAction<T = void>(id: string, action: string, extra?: object): Promise<T> {
  return apiFetch<T>('/sessions', {
    method: 'PATCH',
    body: JSON.stringify({ id, action, ...extra }),
  });
}

export async function addBuyIn(sessionId: string, memberId: string): Promise<void> {
  await sessionAction(sessionId, 'addBuyIn', { memberId });
}

export async function removeBuyIn(sessionId: string, memberId: string): Promise<void> {
  await sessionAction(sessionId, 'removeBuyIn', { memberId });
}

export async function endMemberSession(sessionId: string, memberId: string, chipsLeft: number): Promise<void> {
  await sessionAction(sessionId, 'endMember', { memberId, chipsLeft });
}

export async function resumeMemberSession(sessionId: string, memberId: string): Promise<void> {
  await sessionAction(sessionId, 'resumeMember', { memberId });
}

export async function endSessionForAll(
  sessionId: string,
  memberChips: { memberId: string; chipsLeft: number }[],
): Promise<CompleteSessionResult> {
  return sessionAction<CompleteSessionResult>(sessionId, 'end', { memberChips });
}

export async function endOnlineSession(
  sessionId: string,
  memberChipPnl: { memberId: string; chipPnl: number }[],
): Promise<CompleteSessionResult> {
  return sessionAction<CompleteSessionResult>(sessionId, 'endOnline', { memberChipPnl });
}

export async function addMemberToSession(sessionId: string, memberId: string): Promise<void> {
  await sessionAction(sessionId, 'addMember', { memberId });
}

export async function cancelSession(sessionId: string): Promise<void> {
  await sessionAction(sessionId, 'cancel');
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function chipToMoneyRate(session: Session): number {
  if (session.isCustomRatio && session.customCashAmount && session.customChipAmount) {
    return session.customCashAmount / session.customChipAmount;
  }
  return 1 / session.chipRatio;
}
