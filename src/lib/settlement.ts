export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export function computeSettlements(balances: { name: string; balance: number }[]): Transfer[] {
  const creditors = balances
    .filter(p => p.balance >= 1)
    .map(p => ({ name: p.name, amount: p.balance }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter(p => p.balance <= -1)
    .map(p => ({ name: p.name, amount: -p.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const payment = Math.min(creditors[ci].amount, debtors[di].amount);
    if (payment >= 1) {
      transfers.push({ from: debtors[di].name, to: creditors[ci].name, amount: Math.round(payment) });
    }
    creditors[ci].amount -= payment;
    debtors[di].amount -= payment;
    if (creditors[ci].amount < 1) ci++;
    if (debtors[di].amount < 1) di++;
  }

  return transfers;
}

export function shareText(transfers: Transfer[]): string {
  const groups: Record<string, Transfer[]> = {};
  for (const t of transfers) {
    if (!groups[t.from]) groups[t.from] = [];
    groups[t.from].push(t);
  }
  const lines = ['Quick Settlement', ''];
  for (const [payer, txns] of Object.entries(groups)) {
    for (const t of txns) lines.push(`${payer} → ${t.to} ₹${t.amount.toLocaleString()}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}
