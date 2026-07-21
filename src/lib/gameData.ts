import type { Player, GameSession } from './types';

export type GameDataType = 'online' | 'offline' | 'tournament' | 'offline_tournament';

export async function fetchGameData(type: GameDataType): Promise<{ players: Player[]; sessions: GameSession[] }> {
  const res = await fetch(`/api/game-data?type=${type}`);
  if (!res.ok) throw new Error('Failed to load game data');
  return res.json();
}

export const fetchOfflineGameData = () => fetchGameData('offline');
export const fetchOnlineGameData = () => fetchGameData('online');
export const fetchTournamentData = () => fetchGameData('tournament');
export const fetchOfflineTournamentData = () => fetchGameData('offline_tournament');
