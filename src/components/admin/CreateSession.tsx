import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getMembers, createSession, gameTypeLabel, isChipPnlSession, type GameType } from '../../lib/adminData';
import type { Member } from '../../lib/adminData';
import { useToast } from '../../lib/useToast';
import { Toast } from './Toast';

interface CreateSessionProps {
  gameType: GameType;
  onBack: () => void;
  onSessionCreated: (sessionId: string) => void;
  recentSessionsPlayers?: string[][];
  prefetchedMembers?: Member[];
}

export function CreateSession({ gameType, onBack, onSessionCreated, recentSessionsPlayers = [], prefetchedMembers = [] }: CreateSessionProps) {
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('Main');
  const [buyInAmount, setBuyInAmount] = useState('500');
  const [ratioMoney, setRatioMoney] = useState('25');
  const [ratioChips, setRatioChips] = useState('100');
  const [customCash, setCustomCash] = useState('');
  const [customChips, setCustomChips] = useState('');
  const [ratioType, setRatioType] = useState<'1:1' | '1:2' | '1:4' | 'custom'>('1:4');
  const [selected, setSelected] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [orderedMembers, setOrderedMembers] = useState<Member[]>([]);
  const [creating, setCreating] = useState(false);
  const { message, toast } = useToast();
  const isChipPnl = isChipPnlSession(gameType);

  useEffect(() => {
    function sortMembers(allMembers: Member[]) {
      const priorityMap = new Map<string, number>();
      recentSessionsPlayers.forEach((players, i) => {
        players.forEach(name => {
          const key = name.toLowerCase();
          if (!priorityMap.has(key)) priorityMap.set(key, i);
        });
      });
      return [...allMembers].sort((a, b) => {
        const aP = priorityMap.get(a.name.toLowerCase()) ?? recentSessionsPlayers.length;
        const bP = priorityMap.get(b.name.toLowerCase()) ?? recentSessionsPlayers.length;
        return aP - bP;
      });
    }
    if (prefetchedMembers.length > 0) setOrderedMembers(sortMembers(prefetchedMembers));
    else getMembers().then(all => setOrderedMembers(sortMembers(all)));
  }, [recentSessionsPlayers, prefetchedMembers]);

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  const selectedNames = orderedMembers
    .filter(m => selected.includes(m.id))
    .map(m => m.name);

  async function handleCreate() {
    if (selected.length === 0) { toast('Select at least one member', 'error'); return; }
    if (!sessionDate) { toast('Select a session date', 'error'); return; }
    const name = sessionName.trim() || 'Main';
    let chipRatio = 1;
    let isCustomRatio = false;
    let customCashAmount: number | undefined;
    let customChipAmount: number | undefined;
    let buyIn = 0;

    if (isChipPnl) {
      const money = parseFloat(ratioMoney);
      const chips = parseFloat(ratioChips);
      if (!money || !chips) { toast('Enter chip ratio', 'error'); return; }
      isCustomRatio = true;
      customCashAmount = money;
      customChipAmount = chips;
      chipRatio = chips / money;
      buyIn = money;
    } else {
      if (!buyInAmount || parseFloat(buyInAmount) <= 0) { toast('Enter a valid buy-in amount', 'error'); return; }
      buyIn = parseFloat(buyInAmount);
      if (ratioType === '1:2') chipRatio = 2;
      else if (ratioType === '1:4') chipRatio = 4;
      else if (ratioType === 'custom') {
        if (!customCash || !customChips) { toast('Enter custom ratio values', 'error'); return; }
        isCustomRatio = true;
        customCashAmount = parseFloat(customCash);
        customChipAmount = parseFloat(customChips);
        chipRatio = customChipAmount / customCashAmount;
      }
    }

    setCreating(true);
    try {
      const s = await createSession({
        date: sessionDate,
        gameType,
        sessionName: name,
        buyInAmount: buyIn,
        chipRatio,
        isCustomRatio,
        customCashAmount,
        customChipAmount,
        members: selected.map(id => ({ memberId: id, buyIns: 1, chipsLeft: null })),
        isActive: true,
      });
      toast('Session created!');
      setTimeout(() => onSessionCreated(s.id), 600);
    } catch {
      toast('Failed to create session', 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <Toast message={message} />
      <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col flex-1 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-gray-900 text-2xl font-bold">Create Session</h1>
            <p className="text-sm text-gray-500">{gameTypeLabel(gameType)}</p>
          </div>
        </div>

        <div className="space-y-6 flex flex-col flex-1 overflow-y-auto">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Session Date</p>
            <input
              type="date"
              value={sessionDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-violet-400 text-base font-semibold text-gray-900"
            />
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Session Name</p>
            <input
              type="text"
              placeholder="e.g. Main, Table 2, Session 1"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-violet-400 text-base font-semibold text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Use different names when multiple sessions run on the same day</p>
          </div>

          {(selected.length > 0 || sessionDate || sessionName !== 'Main') && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl space-y-2">
              <p className="text-sm font-bold text-violet-900">Session summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-violet-600">Date: </span>
                  <span className="font-semibold text-violet-900">{sessionDate}</span>
                </div>
                <div>
                  <span className="text-violet-600">Name: </span>
                  <span className="font-semibold text-violet-900">{sessionName.trim() || 'Main'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-violet-600">Players ({selected.length}): </span>
                  <span className="font-semibold text-violet-900">
                    {selected.length > 0 ? selectedNames.join(', ') : 'None selected yet'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isChipPnl ? (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Chip → Money Ratio</p>
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Chips</p>
                  <input type="number" placeholder="100" value={ratioChips} onChange={e => setRatioChips(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-bold text-gray-900" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">= ₹</p>
                  <input type="number" placeholder="25" value={ratioMoney} onChange={e => setRatioMoney(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-bold text-gray-900" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">e.g. 100 chips = ₹25 actual</p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Buy-in Amount</p>
                <input type="number" placeholder="500" value={buyInAmount} onChange={e => setBuyInAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-violet-400 text-xl font-bold text-gray-900" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Chip Ratio</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['1:1', '1:2', '1:4', 'custom'] as const).map(r => (
                    <button key={r} onClick={() => setRatioType(r)}
                      className={`py-2.5 px-3 rounded-xl font-bold transition-all ${ratioType === r ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {r === 'custom' ? 'Custom' : r}
                    </button>
                  ))}
                </div>
                {ratioType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Cash</p>
                      <input type="number" value={customCash} onChange={e => setCustomCash(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-bold text-gray-900" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Chips</p>
                      <input type="number" value={customChips} onChange={e => setCustomChips(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-bold text-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Select Members</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${selected.length > 0 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
                {selected.length} selected
              </span>
            </div>
            <input type="text" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-violet-400 text-base text-gray-900 mb-3" />
            <div className="space-y-2 overflow-y-auto flex-1">
              {orderedMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())).map(m => (
                <label key={m.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} className="w-4 h-4 accent-violet-500" />
                  <span className="text-gray-900 font-bold text-base">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 pb-20 pt-3 px-4" style={{ background: 'linear-gradient(to top, white 70%, transparent)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={handleCreate} disabled={creating}
            className="w-full py-4 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-lg rounded-2xl shadow-lg disabled:opacity-60">
            {creating ? 'Creating…' : selected.length > 0 ? `Create Session (${selected.length} players)` : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
