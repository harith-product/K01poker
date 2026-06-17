import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getActiveSession, fmtDate } from '../../lib/adminData';
import type { Session } from '../../lib/adminData';
import type { AdminScreen } from '../AdminTab';

interface CurrentSessionProps {
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  onNavigate: (screen: AdminScreen) => void;
}

export function CurrentSession({ onBack, onOpenSession, onNavigate }: CurrentSessionProps) {
  const [activeSession, setActiveSession] = useState<Session | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveSession().then(s => { setActiveSession(s); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="bg-white rounded-3xl p-6 shadow-sm text-center py-12 text-gray-400">Loading…</div>
    </div>
  );

  if (!activeSession) return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900 text-2xl font-bold">Current Session</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🃏</div>
          <p className="text-gray-600 mb-6">No session running right now</p>
          <button onClick={() => onNavigate('createSession')} className="px-6 py-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold rounded-2xl">
            Create a session
          </button>
        </div>
      </div>
    </div>
  );

  const totalBuyIns = activeSession.members.reduce((s, m) => s + m.buyIns, 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900 text-2xl font-bold">Current Session</h1>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-4">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎲</div>
            <h2 className="text-gray-900 text-xl font-semibold mb-1">Session Active</h2>
            <p className="text-gray-600 text-sm">Started on {fmtDate(activeSession.date)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">Players</p>
              <p className="text-2xl font-mono text-gray-900">{activeSession.members.length}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">Total Buy-ins</p>
              <p className="text-2xl font-mono text-gray-900">{totalBuyIns}</p>
            </div>
          </div>
          <button onClick={() => onOpenSession(activeSession.id)} className="w-full py-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl">
            Open Session
          </button>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-xs text-gray-600 mb-2">Session Info</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Buy-in Amount:</span>
              <span className="font-mono text-gray-900">{activeSession.buyInAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chip Ratio:</span>
              <span className="font-mono text-gray-900">
                {activeSession.isCustomRatio ? `${activeSession.customCashAmount}:${activeSession.customChipAmount}` : `1:${activeSession.chipRatio}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
