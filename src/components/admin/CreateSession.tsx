import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getMembers, createSession } from '../../lib/adminData';
import type { Member } from '../../lib/adminData';
import { useToast } from '../../lib/useToast';
import { Toast } from './Toast';

interface CreateSessionProps {
  onBack: () => void;
  onSessionCreated: (sessionId: string) => void;
  recentSessionsPlayers?: string[][];
  prefetchedMembers?: Member[];
}

type RatioType = '1:1' | '1:2' | '1:4' | 'custom';

export function CreateSession({ onBack, onSessionCreated, recentSessionsPlayers = [], prefetchedMembers = [] }: CreateSessionProps) {
  const [buyInAmount, setBuyInAmount] = useState('500');
  const [ratioType, setRatioType] = useState<RatioType>('1:4');
  const [customCash, setCustomCash] = useState('');
  const [customChips, setCustomChips] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [orderedMembers, setOrderedMembers] = useState<Member[]>([]);
  const [creating, setCreating] = useState(false);
  const { message, toast } = useToast();

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
        const aPriority = priorityMap.get(a.name.toLowerCase()) ?? recentSessionsPlayers.length;
        const bPriority = priorityMap.get(b.name.toLowerCase()) ?? recentSessionsPlayers.length;
        return aPriority - bPriority;
      });
    }
    if (prefetchedMembers.length > 0) {
      setOrderedMembers(sortMembers(prefetchedMembers));
    } else {
      getMembers().then(allMembers => setOrderedMembers(sortMembers(allMembers)));
    }
  }, [recentSessionsPlayers, prefetchedMembers]);

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function handleCreate() {
    if (!buyInAmount || parseFloat(buyInAmount) <= 0) { toast('Enter a valid buy-in amount', 'error'); return; }
    if (ratioType === 'custom' && (!customCash || !customChips)) { toast('Enter custom ratio values', 'error'); return; }
    if (selected.length === 0) { toast('Select at least one member', 'error'); return; }

    let chipRatio = 1;
    let isCustomRatio = false;
    let customCashAmount: number | undefined;
    let customChipAmount: number | undefined;

    if (ratioType === '1:2') chipRatio = 2;
    else if (ratioType === '1:4') chipRatio = 4;
    else if (ratioType === 'custom') {
      isCustomRatio = true;
      customCashAmount = parseFloat(customCash);
      customChipAmount = parseFloat(customChips);
      chipRatio = customChipAmount / customCashAmount;
    }

    setCreating(true);
    try {
      const s = await createSession({
        date: new Date().toISOString().split('T')[0],
        buyInAmount: parseFloat(buyInAmount),
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
          <h1 className="text-gray-900 text-2xl font-bold">Create Session</h1>
        </div>

        <div className="space-y-6 flex flex-col flex-1 overflow-y-auto">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Buy-in Amount</p>
            <input type="number" placeholder="500" value={buyInAmount} onChange={e => setBuyInAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-violet-400 text-xl font-bold text-gray-900" />
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Chip Ratio</p>
            <div className="grid grid-cols-4 gap-2">
              {(['1:1', '1:2', '1:4', 'custom'] as RatioType[]).map(r => (
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
                  <input type="number" placeholder="10" value={customCash} onChange={e => setCustomCash(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-bold text-gray-900" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Chips</p>
                  <input type="number" placeholder="30" value={customChips} onChange={e => setCustomChips(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-violet-400 font-bold text-gray-900" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Select Members</p>
            <input type="text" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:border-violet-400 text-base text-gray-900 mb-3" />
            <div className="space-y-2 overflow-y-auto flex-1">
              {orderedMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())).map(m => (
                <label key={m.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all cursor-pointer">
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
            {creating ? 'Creating…' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
