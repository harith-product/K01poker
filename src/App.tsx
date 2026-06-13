import { useState, useEffect, useRef } from 'react';
import { Navigation, type TabType } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { StatsTab } from './components/StatsTab';
import { GamesTab } from './components/GamesTab';
import { BalanceTab } from './components/BalanceTab';
import { PlayerDetailSheet } from './components/PlayerDetailSheet';
import { fetchSheetData, fetchBalanceData } from './lib/googleSheets';
import type { Player, GameSession, BalanceData } from './lib/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [balance, setBalance] = useState<BalanceData>({ owesHouse: [], houseOwes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    Promise.all([fetchSheetData(), fetchBalanceData()])
      .then(([sheetData, balanceData]) => {
        setPlayers(sheetData.players);
        setSessions(sheetData.sessions);
        setBalance(balanceData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fix #3: scroll to top on tab switch
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <main ref={mainRef} className="pb-24 min-h-screen overflow-y-auto h-screen">
        {loading && (
          <div className="max-w-lg mx-auto px-4 pt-20 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading leaderboard…</p>
          </div>
        )}
        {error && (
          <div className="max-w-lg mx-auto px-4 pt-20 text-center">
            <p className="text-red-500 mb-2">Failed to load data</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <>
            {activeTab === 'home' && <HomeTab players={players} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'leaderboard' && <StatsTab players={players} sessions={sessions} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'games' && <GamesTab sessions={sessions} players={players} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'balance' && <BalanceTab balance={balance} />}
          </>
        )}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Fix #2: proper full-screen overlay with dark backdrop */}
      {selectedPlayerId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedPlayerId(null)}
          />
          <div className="relative w-full max-w-lg mx-auto">
            <PlayerDetailSheet
              player={selectedPlayer}
              open={!!selectedPlayerId}
              onClose={() => setSelectedPlayerId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
