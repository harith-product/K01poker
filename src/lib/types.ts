export interface GameSession {
  date: string;      // "04-Jun"
  session: string;   // "Main", "Table 2", etc.
  players: Record<string, number>; // playerName -> P&L amount
}

export interface BalanceEntry {
  name: string;
  amount: number;
}

export interface BalanceData {
  owesHouse: BalanceEntry[];   // negative amounts — players owe house
  houseOwes: BalanceEntry[];   // positive amounts — house owes players
}

export interface Player {
  id: string;
  name: string;
  results: { date: string; session: string; amount: number; source?: 'online' | 'offline' }[];
  totalWinnings: number;
  gamesPlayed: number;
  avgPerGame: number;
  bestResult: number;
  worstResult: number;
}
