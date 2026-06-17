import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getSessions, getMembers, fmtDate } from '../../lib/adminData';
import type { Session, Member } from '../../lib/adminData';
import { useToast } from '../../lib/useToast';
import { Toast } from './Toast';

interface PastSessionDetailsProps {
  sessionId: string;
  onBack: () => void;
}

export function PastSessionDetails({ sessionId, onBack }: PastSessionDetailsProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, { buyIns: string; chipsLeft: string }>>({});
  const { message, toast } = useToast();

  useEffect(() => {
    Promise.all([getSessions(), getMembers()]).then(([sessions, allMembers]) => {
      const s = sessions.find(s => s.id === sessionId) ?? null;
      setSession(s);
      setMembers(allMembers);
      if (s) {
        const init: Record<string, { buyIns: string; chipsLeft: string }> = {};
        s.members.forEach(m => {
          init[m.memberId] = { buyIns: m.buyIns.toString(), chipsLeft: (m.chipsLeft || 0).toString() };
        });
        setEdited(init);
      }
      setLoading(false);
    });
  }, [sessionId]);

  function getMemberById(id: string) { return members.find(m => m.id === id); }
  function update(memberId: string, field: 'buyIns' | 'chipsLeft', value: string) {
    setEdited(prev => ({ ...prev, [memberId]: { ...prev[memberId], [field]: value } }));
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      const updatedMembers = session.members.map(m => ({
        memberId: m.memberId,
        buyIns: parseInt(edited[m.memberId]?.buyIns || '1'),
        chipsLeft: parseFloat(edited[m.memberId]?.chipsLeft || '0'),
      }));
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, action: 'updateMembers', members: updatedMembers }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Changes saved!');
      setTimeout(onBack, 700);
    } catch {
      toast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
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

  const totalBuyIns = Object.values(edited).reduce((s, m) => s + parseInt(m.buyIns || '0'), 0);
  const totalChipsOut = Object.values(edited).reduce((s, m) => s + parseFloat(m.chipsLeft || '0'), 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <Toast message={message} />
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-gray-900 text-xl font-bold">Past Session</h1>
            <p className="text-sm text-gray-500">{fmtDate(session.date)}</p>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-400 mb-1">Buy-in</p><p className="font-bold text-gray-900 text-xl">{session.buyInAmount}</p></div>
            <div><p className="text-xs text-gray-400 mb-1">Chip Ratio</p><p className="font-bold text-gray-900 text-xl">{session.isCustomRatio ? `${session.customCashAmount}:${session.customChipAmount}` : `1:${session.chipRatio}`}</p></div>
            <div><p className="text-xs text-gray-400 mb-1">Total Buy-ins</p><p className="font-bold text-gray-900 text-xl">{totalBuyIns}</p></div>
            <div><p className="text-xs text-gray-400 mb-1">Total Chips Out</p><p className="font-bold text-gray-900 text-xl">{totalChipsOut}</p></div>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Members</p>
          {session.members.map(sm => {
            const member = getMemberById(sm.memberId);
            if (!member) return null;
            return (
              <div key={sm.memberId} className="p-4 bg-gray-50 rounded-2xl">
                <p className="font-bold text-gray-900 text-base mb-3">{member.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Buy-ins</p>
                    <input type="number" value={edited[sm.memberId]?.buyIns || '1'}
                      onChange={e => update(sm.memberId, 'buyIns', e.target.value)}
                      className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-purple-400 font-bold text-gray-900" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Chips left</p>
                    <input type="number" value={edited[sm.memberId]?.chipsLeft || '0'}
                      onChange={e => update(sm.memberId, 'chipsLeft', e.target.value)}
                      className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 outline-none focus:border-purple-400 font-bold text-gray-900" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
