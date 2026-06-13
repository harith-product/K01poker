export interface GameSession {
  date: string;      // "04-Jun"
  session: string;   // "Main", "Table 2", etc.
  players: Record<string, number>; // playerName -> P&L amount
}

export interface Player {
  id: string;
  name: string;
  results: { date: string; session: string; amount: number }[];
  totalWinnings: number;
  gamesPlayed: number;
  avgPerGame: number;
  bestResult: number;
  worstResult: number;
}
