export function formatAmount(value: number, compact = true): string {
  if (!compact || Math.abs(value) < 1000) return value.toLocaleString();
  return `${(value / 1000).toFixed(1)}K`;
}

export function formatWithSign(value: number, compact = true): string {
  const formatted = formatAmount(Math.abs(value), compact);
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}
