import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getSessions, fmtDate } from '../../lib/adminData';
import type { Session } from '../../lib/adminData';

interface PastSessionsProps {
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function PastSessions({ onBack, onSelectSession }: PastSessionsProps) {
  const [past, setPast] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions().then(sessions => {
      const sorted = sessions
        .filter(s => !s.isActive)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPast(sorted);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900 text-2xl font-bold">Past Sessions</h1>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : past.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📜</div>
            <p className="text-gray-500">No past sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map(s => {
              const totalBuyIns = s.members.reduce((sum, m) => sum + m.buyIns, 0);
              const totalChipsOut = s.members.reduce((sum, m) => sum + (m.chipsLeft || 0), 0);
              return (
                <button key={s.id} onClick={() => onSelectSession(s.id)}
                  className="w-full p-4 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 rounded-2xl transition-all text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{fmtDate(s.date)}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div><p className="text-xs text-gray-400">Buy-ins</p><p className="font-bold text-gray-900">{totalBuyIns}</p></div>
                        <div><p className="text-xs text-gray-400">Players</p><p className="font-bold text-gray-900">{s.members.length}</p></div>
                        <div><p className="text-xs text-gray-400">Chips Out</p><p className="font-bold text-gray-900">{totalChipsOut}</p></div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
