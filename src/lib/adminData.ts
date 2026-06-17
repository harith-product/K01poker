export interface Member {
  id: string;
  name: string;
}

export interface SessionMember {
  memberId: string;
  buyIns: number;
  chipsLeft: number | null;
}

export interface Session {
  id: string;
  date: string;
  buyInAmount: number;
  chipRatio: number;
  isCustomRatio: boolean;
  customCashAmount?: number;
  customChipAmount?: number;
  members: SessionMember[];
  isActive: boolean;
}

export const ADMIN_PHONE = '9738659221';
export const ADMIN_OTP = '091125';

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
  return apiFetch<Member>('/members', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateMemberName(id: string, name: string): Promise<void> {
  await apiFetch('/members', {
    method: 'PATCH',
    body: JSON.stringify({ id, name }),
  });
}

export async function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>('/sessions');
}

export async function getActiveSession(): Promise<Session | undefined> {
  const sessions = await getSessions();
  return sessions.find(s => s.isActive);
}

export async function createSession(session: Omit<Session, 'id'>): Promise<Session> {
  const { id } = await apiFetch<{ id: string }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return { ...session, id };
}

async function sessionAction(id: string, action: string, extra?: object): Promise<void> {
  await apiFetch('/sessions', {
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
  memberChips: { memberId: string; chipsLeft: number }[]
): Promise<void> {
  await sessionAction(sessionId, 'end', { memberChips });
}

export async function addMemberToSession(sessionId: string, memberId: string): Promise<void> {
  await sessionAction(sessionId, 'addMember', { memberId });
}

export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
