export interface Settlement {
  id: number;
  playerName: string;
  amount: number;
  direction: string;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
}

export interface BalanceDataResponse {
  balances: { playerName: string; amount: number }[];
  settlements: Settlement[];
}

export function balancesToMap(balances: { playerName: string; amount: number }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const { playerName, amount } of balances) {
    map[playerName] = amount;
  }
  return map;
}

export function balanceMapToList(map: Record<string, number>) {
  return Object.entries(map)
    .filter(([, b]) => Math.abs(b) >= 0.01)
    .map(([name, balance]) => ({ name, balance }));
}

export function getBalanceMap(data: BalanceDataResponse): Record<string, number> {
  return balancesToMap(data.balances);
}
