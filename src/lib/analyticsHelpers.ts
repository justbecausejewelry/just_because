export type AnalyticsPoint = {
  date: string
  value: number
  count: number
}

type AnalyticsRecord = Record<string, unknown>

export function groupByDay<T extends AnalyticsRecord>(
  items: T[],
  dateField: keyof T,
  valueField?: keyof T
): AnalyticsPoint[] {
  const map = new Map<string, number>()

  items.forEach((item) => {
    const rawDate = item[dateField]
    if (typeof rawDate !== 'string' && !(rawDate instanceof Date)) return

    const day = new Date(rawDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const rawValue = valueField ? item[valueField] : 1
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue || 0)
    map.set(day, (map.get(day) || 0) + value)
  })

  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value, count: value }))
    .slice(-30)
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
