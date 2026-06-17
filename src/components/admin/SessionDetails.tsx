import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import {
  getSessions, getMembers,
  addBuyIn, removeBuyIn, endMemberSession, resumeMemberSession,
  endSessionForAll, addMemberToSession, fmtDate,
} from '../../lib/adminData';
import type { Session, Member } from '../../lib/adminData';
import { useToast } from '../../lib/useToast';
import { Toast } from './Toast';

interface SessionDetailsProps {
  sessionId: string;
  onBack: () => void;
}

type BottomSheet = 'none' | 'endMember' | 'endAll';

export function SessionDetails({ sessionId, onBack }: SessionDetailsProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<BottomSheet>('none');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [chipsLeft, setChipsLeft] = useState('');
  const [allChips, setAllChips] = useState<Record<string, string>>({});
  const [newMemberId, setNewMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberList, setShowMemberList] = useState(false);
  const { message, toast } = useToast();
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  function load() {
    return Promise.all([getSessions(), getMembers()]).then(([sessions, allMembers]) => {
      setSession(sessions.find(s => s.id === sessionId) ?? null);
      setMembers(allMembers);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [sessionId]);
  useEffect(() => { if (sheet === 'endAll') setTimeout(() => firstInputRef.current?.focus(), 50); }, [sheet]);

  function getMemberById(id: string) { return members.find(m => m.id === id); }

  async function handleEndMember() {
    if (!selectedMemberId || !chipsLeft) { toast('Enter chips left', 'error'); return; }
    try {
      await endMemberSession(sessionId, selectedMemberId, parseFloat(chipsLeft));
      toast(`Session ended for ${getMemberById(selectedMemberId)?.name}`);
      setSheet('none'); setSelectedMemberId(null); setChipsLeft('');
      await load();
    } catch { toast('Failed to update', 'error'); }
  }

  async function handleEndAll() {
    if (!session) return;
    const active = session.members.filter(m => m.chipsLeft === null);
    const memberChips = active.map(m => ({ memberId: m.memberId, chipsLeft: parseFloat(allChips[m.memberId] || '0') }));
    if (memberChips.some(mc => isNaN(mc.chipsLeft))) { toast('Enter chips for all members', 'error'); return; }
    const totalBuyIns = session.members.reduce((s, m) => s + m.buyIns, 0);
    const chipsPerBuyIn = session.isCustomRatio
      ? (session.customChipAmount! / session.customCashAmount!) * session.buyInAmount
      : session.buyInAmount * session.chipRatio;
    const totalChipsGiven = totalBuyIns * chipsPerBuyIn;
    const chipsEntered = memberChips.reduce((s, m) => s + m.chipsLeft, 0);
    if (chipsEntered !== totalChipsGiven) { toast('Remaining amount should be 0 to end the session', 'error'); return; }
    try {
      await endSessionForAll(sessionId, memberChips);
      toast('Session ended for all!');
      setSheet('none');
      setTimeout(() => { setAllChips({}); onBack(); }, 800);
    } catch { toast('Failed to end session', 'error'); }
  }

  async function handleAddMember() {
    if (!newMemberId) return;
    try {
      await addMemberToSession(sessionId, newMemberId);
      toast('Member added!');
      setNewMemberId('');
      await load();
    } catch { toast('Failed to add member', 'error'); }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm text-center py-12 text-gray-400">Loading…</div>
    </div>
  );

  if (!session) return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <p className="text-gray-600">Session not found</p>
        <button onClick={onBack} className="mt-4 text-purple-600 font-medium">Go Back</button>
      </div>
    </div>
  );

  const availableMembers = members.filter(m => !session.members.some(sm => sm.memberId === m.id));
  const totalBuyIns = session.members.reduce((s, m) => s + m.buyIns, 0);
  const chipsPerBuyIn = session.isCustomRatio
    ? (session.customChipAmount! / session.customCashAmount!) * session.buyInAmount
    : session.buyInAmount * session.chipRatio;
  const totalChipsGiven = totalBuyIns * chipsPerBuyIn;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <Toast message={message} />
      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">Session Details</h1>
            <p className="text-sm text-gray-500">{fmtDate(session.date)}</p>
          </div>
          {session.isActive && (
            <button onClick={() => setSheet('endAll')} className="ml-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-xl text-sm">End All</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl text-sm">
          <div><p className="text-xs text-gray-400 mb-1">Buy-in</p><p className="font-bold text-gray-900">{session.buyInAmount}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">Chip Ratio</p><p className="font-bold text-gray-900">{session.isCustomRatio ? `${session.customCashAmount}:${session.customChipAmount}` : `1:${session.chipRatio}`}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">Total Buy-ins</p><p className="font-bold text-gray-900">{totalBuyIns}</p></div>
          <div><p className="text-xs text-gray-400 mb-1">Total Chips</p><p className="font-bold text-gray-900">{totalChipsGiven.toLocaleString()}</p></div>
        </div>
        <div className="space-y-3">
          {session.members.map(sm => {
            const member = getMemberById(sm.memberId);
            if (!member) return null;
            const done = sm.chipsLeft !== null;
            return (
              <div key={sm.memberId} className={`p-4 rounded-2xl ${done ? 'bg-gray-50 opacity-60' : 'bg-green-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{member.name}</p>
                    {done && <p className="text-xs text-gray-500 mt-0.5">Chips out: {sm.chipsLeft}</p>}
                  </div>
                  {!done && session.isActive && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-sm">
                        <button onClick={async () => { await removeBuyIn(sessionId, sm.memberId); load(); }} className="text-green-600 font-bold text-lg w-5 text-center">−</button>
                        <span className="font-bold text-gray-900 w-4 text-center">{sm.buyIns}</span>
                        <button onClick={async () => { await addBuyIn(sessionId, sm.memberId); load(); }} className="text-green-600 font-bold text-lg w-5 text-center">+</button>
                      </div>
                      <button onClick={() => { setSelectedMemberId(sm.memberId); setChipsLeft(''); setSheet('endMember'); }} className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  {done && session.isActive && (
                    <button onClick={async () => { await resumeMemberSession(sessionId, sm.memberId); load(); }} className="text-xs text-purple-600 font-medium">Resume</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {session.isActive && availableMembers.length > 0 && (() => {
          const filtered = availableMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
          const selectedName = availableMembers.find(m => m.id === newMemberId)?.name;
          return (
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Add to Session</p>
              <div className="relative">
                <input type="text" placeholder="Search member..." value={showMemberList ? memberSearch : (selectedName || '')}
                  onFocus={() => { setShowMemberList(true); setMemberSearch(''); }}
                  onChange={e => { setMemberSearch(e.target.value); setNewMemberId(''); }}
                  className="w-full px-4 py-3.5 bg-white rounded-2xl border border-gray-200 outline-none focus:border-purple-400 text-lg font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-400" />
                {showMemberList && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMemberList(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl z-20 overflow-hidden border border-gray-100">
                      {filtered.length === 0 ? <p className="px-4 py-3 text-gray-400 text-sm">No members found</p>
                        : filtered.map(m => (
                          <button key={m.id} onClick={() => { setNewMemberId(m.id); setShowMemberList(false); setMemberSearch(''); }}
                            className="w-full text-left px-4 py-3.5 text-lg font-bold text-gray-900 hover:bg-purple-50 border-b border-gray-50 last:border-0 transition-colors">{m.name}</button>
                        ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => { handleAddMember(); setMemberSearch(''); }} disabled={!newMemberId}
                className="w-full mt-3 py-3.5 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-base font-bold rounded-2xl disabled:opacity-40">Add to Session</button>
            </div>
          );
        })()}
      </div>
      {sheet !== 'none' && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet('none')} />
          <div className="relative bg-white rounded-t-3xl p-6 max-w-lg w-full mx-auto">
            {sheet === 'endMember' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div><h2 className="text-2xl font-bold text-gray-900">End Session</h2><p className="text-gray-400 text-sm mt-0.5">Enter chips left for this player</p></div>
                  <button onClick={() => { setSheet('none'); setChipsLeft(''); }} className="text-gray-400 text-sm font-medium">Cancel</button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-6">
                  <span className="text-xl font-bold text-gray-900">{selectedMemberId && getMemberById(selectedMemberId)?.name}</span>
                  <input type="number" inputMode="numeric" placeholder="0" value={chipsLeft} onChange={e => setChipsLeft(e.target.value)} autoFocus
                    className="w-28 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-purple-400 text-xl font-bold text-gray-900 text-center" />
                </div>
                <button onClick={handleEndMember} className="w-full py-4 bg-red-500 text-white text-lg font-bold rounded-2xl">Confirm & End</button>
              </>
            )}
            {sheet === 'endAll' && (() => {
              const chipsEntered = Object.values(allChips).reduce((s, v) => s + (parseFloat(v) || 0), 0);
              const remaining = totalChipsGiven - chipsEntered;
              const activeMembers = session.members.filter(sm => sm.chipsLeft === null);
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">End Session</h2>
                    <button onClick={() => setSheet('none')} className="text-gray-500 text-sm font-bold">Cancel</button>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">Enter chips left for each player</p>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-sm text-gray-500">Remaining:</span>
                    <span className={`text-lg font-bold ${remaining === 0 ? 'text-green-600' : remaining < 0 ? 'text-red-500' : 'text-gray-900'}`}>{remaining.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">/ {totalChipsGiven.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 overflow-y-auto mb-6" style={{ maxHeight: '45vh' }}>
                    {activeMembers.map((sm, i) => {
                      const member = getMemberById(sm.memberId);
                      if (!member) return null;
                      return (
                        <div key={sm.memberId} className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                          <span className="text-xl font-bold text-gray-900 flex-1">{member.name}</span>
                          <input ref={i === 0 ? firstInputRef : null} type="number" inputMode="numeric" placeholder="0"
                            value={allChips[sm.memberId] || ''} onChange={e => setAllChips(prev => ({ ...prev, [sm.memberId]: e.target.value }))}
                            className="w-28 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 outline-none focus:border-purple-400 text-xl font-bold text-gray-900 text-center" />
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={handleEndAll} className="w-full py-4 bg-red-500 text-white text-lg font-bold rounded-2xl">End Session</button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
