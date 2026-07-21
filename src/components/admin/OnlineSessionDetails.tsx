import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  getSessions, getMembers, endOnlineSession, cancelSession, addMemberToSession,
  fmtDate, chipToMoneyRate, gameTypeLabel,
} from '../../lib/adminData';
import type { Session, Member } from '../../lib/adminData';
import { useToast } from '../../lib/useToast';
import { Toast } from './Toast';

interface OnlineSessionDetailsProps {
  sessionId: string;
  onBack: () => void;
}

export function OnlineSessionDetails({ sessionId, onBack }: OnlineSessionDetailsProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [chipPnl, setChipPnl] = useState<Record<string, string>>({});
  const [ending, setEnding] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberList, setShowMemberList] = useState(false);
  const { message, toast } = useToast();

  function load() {
    return Promise.all([getSessions(), getMembers()]).then(([sessions, allMembers]) => {
      setSession(sessions.find(s => s.id === sessionId) ?? null);
      setMembers(allMembers);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [sessionId]);

  if (loading) return <div className="max-w-lg mx-auto px-4 pt-6 text-center text-gray-400 py-12">Loading…</div>;
  if (!session) return <div className="max-w-lg mx-auto px-4 pt-6"><p>Session not found</p></div>;

  const rate = chipToMoneyRate(session);
  const playerNames = session.members
    .map(sm => members.find(m => m.id === sm.memberId)?.name)
    .filter((n): n is string => !!n);
  const availableMembers = members.filter(m => !session.members.some(sm => sm.memberId === m.id));
  const moneyPnls = session.members.map(sm => {
    const chips = parseFloat(chipPnl[sm.memberId] || '0');
    return { memberId: sm.memberId, chips, money: chips * rate };
  });
  const moneySum = moneyPnls.reduce((s, p) => s + p.money, 0);
  const rake = moneySum < 0 ? Math.abs(moneySum) : 0;
  const pnlEntered = session.members.filter(sm => chipPnl[sm.memberId] !== undefined && chipPnl[sm.memberId] !== '').length;

  async function handleAddMember() {
    if (!newMemberId) return;
    try {
      await addMemberToSession(sessionId, newMemberId);
      toast('Player added!');
      setNewMemberId('');
      setMemberSearch('');
      await load();
    } catch {
      toast('Failed to add player', 'error');
    }
  }

  async function handleEnd() {
    if (!session) return;
    const memberChipPnl = session.members.map(sm => ({
      memberId: sm.memberId,
      chipPnl: parseFloat(chipPnl[sm.memberId] || '0'),
    }));
    if (memberChipPnl.some(m => isNaN(m.chipPnl))) {
      toast('Enter P&L for all players', 'error');
      return;
    }
    const sum = memberChipPnl.reduce((s, m) => s + m.chipPnl * rate, 0);
    if (sum > 0) {
      toast(`Total P&L cannot be positive. Current: ₹${sum.toFixed(2)}`, 'error');
      return;
    }
    setEnding(true);
    try {
      const result = await endOnlineSession(sessionId, memberChipPnl);
      toast(`Session ended! Rake: ₹${result.rake.toLocaleString()}`);
      setTimeout(onBack, 1000);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to end session', 'error');
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <Toast message={message} />
      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-gray-900 text-xl font-bold">{gameTypeLabel(session.gameType)}</h1>
            <p className="text-sm text-gray-500">{fmtDate(session.date)} · {session.sessionName || 'Main'}</p>
          </div>
          {session.isActive && (
            <button onClick={async () => { await cancelSession(sessionId); onBack(); }}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold flex-shrink-0">Cancel</button>
          )}
        </div>

        <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Players</p>
              <p className="text-xl font-bold text-gray-900">{session.members.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">P&L entered</p>
              <p className="text-xl font-bold text-gray-900">{session.isActive ? `${pnlEntered}/${session.members.length}` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Ratio</p>
              <p className="text-sm font-bold text-gray-900">{session.customChipAmount}ch = ₹{session.customCashAmount}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Roster</p>
            <p className="text-sm text-gray-800 leading-relaxed">{playerNames.join(', ') || 'No players yet'}</p>
          </div>
        </div>

        {session.isActive ? (
          <>
            {availableMembers.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Add missing player</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search player..."
                    value={showMemberList ? memberSearch : (availableMembers.find(m => m.id === newMemberId)?.name || '')}
                    onFocus={() => { setShowMemberList(true); setMemberSearch(''); }}
                    onChange={e => { setMemberSearch(e.target.value); setNewMemberId(''); }}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-semibold text-gray-900"
                  />
                  {showMemberList && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMemberList(false)} />
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl z-20 overflow-hidden border border-gray-100 max-h-48 overflow-y-auto">
                        {availableMembers
                          .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                          .map(m => (
                            <button
                              key={m.id}
                              onClick={() => { setNewMemberId(m.id); setShowMemberList(false); setMemberSearch(''); }}
                              className="w-full text-left px-4 py-3 font-semibold text-gray-900 hover:bg-violet-50 border-b border-gray-50 last:border-0"
                            >
                              {m.name}
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberId}
                  className="w-full mt-3 py-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl disabled:opacity-40"
                >
                  Add to session
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 uppercase tracking-wide">Enter chip P&L per player (+ won / − lost)</p>
            <div className="space-y-3">
              {session.members.map(sm => {
                const member = members.find(m => m.id === sm.memberId);
                if (!member) return null;
                const chips = parseFloat(chipPnl[sm.memberId] || '0');
                const money = chips * rate;
                const hasPnl = chipPnl[sm.memberId] !== undefined && chipPnl[sm.memberId] !== '';
                return (
                  <div key={sm.memberId} className={`flex items-center gap-3 p-4 rounded-2xl ${hasPnl ? 'bg-teal-50' : 'bg-gray-50'}`}>
                    <span className="font-bold text-gray-900 flex-1">{member.name}</span>
                    <input type="number" inputMode="decimal" placeholder="0"
                      value={chipPnl[sm.memberId] || ''}
                      onChange={e => setChipPnl(prev => ({ ...prev, [sm.memberId]: e.target.value }))}
                      className="w-24 px-3 py-2 bg-white rounded-xl border border-gray-200 text-center font-bold text-gray-900" />
                    <span className="text-sm text-gray-500 w-20 text-right font-mono">
                      {money !== 0 ? `₹${money.toFixed(0)}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={`p-4 rounded-2xl ${moneySum > 0 ? 'bg-red-50' : moneySum < 0 ? 'bg-violet-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-600">Total P&L sum</p>
              <p className={`text-2xl font-bold font-mono ${moneySum > 0 ? 'text-red-600' : moneySum < 0 ? 'text-violet-700' : 'text-green-700'}`}>
                ₹{moneySum.toFixed(2)}
              </p>
              {moneySum < 0 && (
                <p className="text-sm text-violet-600 mt-1">Rake: ₹{rake.toLocaleString()}</p>
              )}
              {moneySum === 0 && (
                <p className="text-sm text-green-600 mt-1">Rake-free session</p>
              )}
              {moneySum > 0 && (
                <p className="text-xs text-red-500 mt-1">Sum cannot be positive — check player P&L entries</p>
              )}
            </div>

            <button onClick={handleEnd} disabled={ending || moneySum > 0}
              className="w-full py-4 bg-green-500 text-white text-lg font-bold rounded-2xl disabled:opacity-40">
              {ending ? 'Ending…' : `End Session (${session.members.length} players)`}
            </button>
          </>
        ) : (
          <div className="space-y-2">
            {session.members.map(sm => {
              const member = members.find(m => m.id === sm.memberId);
              return (
                <div key={sm.memberId} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium">{member?.name}</span>
                  <span className="font-mono text-sm">
                    {sm.grossPnl != null ? `₹${sm.grossPnl}` : '—'}
                  </span>
                </div>
              );
            })}
            {session.rakeAmount != null && (
              <p className="text-sm text-violet-600 font-medium pt-2">Rake: ₹{session.rakeAmount.toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
