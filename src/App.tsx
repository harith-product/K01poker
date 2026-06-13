import { useState, useEffect, useRef } from 'react';
import { Navigation, type TabType } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { StatsTab } from './components/StatsTab';
import { GamesTab } from './components/GamesTab';
import { BalanceTab } from './components/BalanceTab';
import { PlayerDetailSheet } from './components/PlayerDetailSheet';
import { fetchSheetData, fetchOfflineSheetData, fetchBalanceData } from './lib/googleSheets';
import type { Player, GameSession, BalanceData } from './lib/types';

export type GameMode = 'online' | 'offline';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mode, setMode] = useState<GameMode>('offline');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [onlineSessions, setOnlineSessions] = useState<GameSession[]>([]);
  const [offlinePlayers, setOfflinePlayers] = useState<Player[]>([]);
  const [offlineSessions, setOfflineSessions] = useState<GameSession[]>([]);
  const [balance, setBalance] = useState<BalanceData>({ owesHouse: [], houseOwes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    Promise.all([fetchSheetData(), fetchOfflineSheetData(), fetchBalanceData()])
      .then(([online, offline, bal]) => {
        setOnlinePlayers(online.players);
        setOnlineSessions(online.sessions);
        setOfflinePlayers(offline.players);
        setOfflineSessions(offline.sessions);
        setBalance(bal);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const players = mode === 'online' ? onlinePlayers : offlinePlayers;
  const sessions = mode === 'online' ? onlineSessions : offlineSessions;
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) ?? null;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedPlayerId(null);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const handleModeChange = (m: GameMode) => {
    setMode(m);
    setSelectedPlayerId(null);
    mainRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100">
      <main ref={mainRef} className="pb-24 min-h-screen overflow-y-auto" style={{ height: '100vh' }}>
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
            {activeTab === 'home' && <HomeTab players={players} onPlayerClick={setSelectedPlayerId} mode={mode} onModeChange={handleModeChange} />}
            {activeTab === 'leaderboard' && <StatsTab players={players} sessions={sessions} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'games' && <GamesTab sessions={sessions} players={players} onPlayerClick={setSelectedPlayerId} />}
            {activeTab === 'balance' && <BalanceTab balance={balance} />}
          </>
        )}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />

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
