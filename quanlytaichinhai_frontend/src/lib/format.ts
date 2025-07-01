export function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })
}

export function formatPercentage(change: number): string {
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}
