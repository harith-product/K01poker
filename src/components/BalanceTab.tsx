import type { BalanceData } from '../lib/types';

interface BalanceTabProps {
  balance: BalanceData;
}

export function BalanceTab({ balance }: BalanceTabProps) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-4">
      <h1 className="text-gray-900 text-2xl mb-2">Balance</h1>

      {/* House Owes Players */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-gray-900 font-semibold">House Owes Players</h2>
          <p className="text-xs text-gray-400 mt-0.5">House needs to pay these players</p>
        </div>
        <div className="divide-y divide-gray-100">
          {balance.houseOwes.map((entry, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-medium">
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900">{entry.name}</span>
              </div>
              <span className="font-mono text-green-600">+{entry.amount.toLocaleString()}</span>
            </div>
          ))}
          {balance.houseOwes.length === 0 && (
            <p className="px-5 py-4 text-gray-400 text-sm">No entries</p>
          )}
        </div>
      </div>

      {/* Players Owe House */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-gray-900 font-semibold">Players Owe House</h2>
          <p className="text-xs text-gray-400 mt-0.5">These players need to pay the house</p>
        </div>
        <div className="divide-y divide-gray-100">
          {balance.owesHouse.map((entry, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-sm font-medium">
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900">{entry.name}</span>
              </div>
              <span className="font-mono text-red-600">{entry.amount.toLocaleString()}</span>
            </div>
          ))}
          {balance.owesHouse.length === 0 && (
            <p className="px-5 py-4 text-gray-400 text-sm">No entries</p>
          )}
        </div>
      </div>
    </div>
  );
}
