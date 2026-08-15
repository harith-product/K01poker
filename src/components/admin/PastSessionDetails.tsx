import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getSessions, getMembers, fmtDate, gameTypeLabel, isChipPnlSession } from '../../lib/adminData';
import type { Session, Member } from '../../lib/adminData';

interface PastSessionDetailsProps {
  sessionId: string;
  onBack: () => void;
}

export function PastSessionDetails({ sessionId, onBack }: PastSessionDetailsProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSessions(), getMembers()]).then(([sessions, allMembers]) => {
      setSession(sessions.find(s => s.id === sessionId) ?? null);
      setMembers(allMembers);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center py-12 text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <p className="text-gray-600">Session not found</p>
          <button onClick={onBack} className="mt-4 text-violet-600 font-medium">Go Back</button>
        </div>
      </div>
    );
  }

  const chipPnl = isChipPnlSession(session.gameType);
  const totalBuyIns = session.members.reduce((sum, m) => sum + m.buyIns, 0);
  const totalChipsOut = session.members.reduce((sum, m) => sum + (m.chipsLeft || 0), 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">Past Session</h1>
            <p className="text-sm text-gray-500">{fmtDate(session.date)} · {gameTypeLabel(session.gameType)}</p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl mb-6">
          <div className="grid grid-cols-2 gap-3">
            {!chipPnl && (
              <>
                <div><p className="text-xs text-gray-400 mb-1">Buy-in</p><p className="font-bold text-gray-900 text-xl">{session.buyInAmount}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Chip Ratio</p><p className="font-bold text-gray-900 text-xl">{session.isCustomRatio ? `${session.customCashAmount}:${session.customChipAmount}` : `1:${session.chipRatio}`}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Total Buy-ins</p><p className="font-bold text-gray-900 text-xl">{totalBuyIns}</p></div>
                <div><p className="text-xs text-gray-400 mb-1">Total Chips Out</p><p className="font-bold text-gray-900 text-xl">{totalChipsOut}</p></div>
              </>
            )}
            {chipPnl && session.rakeAmount != null && (
              <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Rake</p><p className="font-bold text-violet-700 text-xl">₹{session.rakeAmount.toLocaleString()}</p></div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Members</p>
          {session.members.map(sm => {
            const member = members.find(m => m.id === sm.memberId);
            return (
              <div key={sm.memberId} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="font-bold text-gray-900">{member?.name ?? 'Unknown'}</span>
                <span className="font-mono text-sm text-gray-700">
                  {chipPnl
                    ? (sm.grossPnl != null ? `₹${sm.grossPnl}` : '—')
                    : `${sm.buyIns} buy-in${sm.buyIns !== 1 ? 's' : ''}${sm.chipsLeft != null ? ` · ${sm.chipsLeft} chips` : ''}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
