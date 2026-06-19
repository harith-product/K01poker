import { computeSettlements, shareText } from '../lib/settlement';
import type { Transfer } from '../lib/settlement';

interface Props {
  balances: { name: string; balance: number }[];
  onClose: () => void;
}

function Avatar({ name, color }: { name: string; color: 'green' | 'red' }) {
  const bg = color === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${bg}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function QuickSettlement({ balances, onClose }: Props) {
  const transfers = computeSettlements(balances);

  // Group by payer
  const groups: Record<string, Transfer[]> = {};
  for (const t of transfers) {
    if (!groups[t.from]) groups[t.from] = [];
    groups[t.from].push(t);
  }

  async function handleShare() {
    const text = shareText(transfers);
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert('Copied to clipboard!');
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-gray-900 font-bold text-lg">Quick Settlement</h2>
              <p className="text-gray-400 text-xs mt-0.5">Recommended transfers to minimise transactions</p>
            </div>
            <button onClick={onClose} className="text-gray-400 text-sm font-medium mt-0.5">Close</button>
          </div>

        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-4xl">✅</span>
              <p className="text-gray-900 font-semibold">Everyone is settled</p>
              <p className="text-gray-400 text-sm">No transfers required.</p>
            </div>
          ) : Object.entries(groups).map(([payer, txns]) => (
            <div key={payer}>
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={payer} color="red" />
                <span className="text-gray-900 font-semibold text-sm">{payer}</span>
              </div>
              <div className="space-y-2 pl-1">
                {txns.map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">→</span>
                      <Avatar name={t.to} color="green" />
                      <span className="text-gray-700 text-sm font-medium">{t.to}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-gray-900">₹{t.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-px bg-gray-100" />
            </div>
          ))}
        </div>

        {/* CTAs */}
        {transfers.length > 0 && (
          <div className="px-5 pb-8 pt-3 flex gap-3 border-t border-gray-100">
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm"
            >
              Share Plan
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-semibold text-sm shadow-md"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </>
  );
}
