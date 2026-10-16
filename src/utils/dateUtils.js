export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDayMonth(iso) {
  const d = parseISODate(iso)
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${day} ${month}`
}

export function formatLongDate(iso) {
  if (!iso) return ''
  return parseISODate(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatMonthYear(year, monthIndex) {
  const d = new Date(year, monthIndex, 1)
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

export function formatMonthOnly(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'long' })
}

export function getMonthBucket(iso) {
  const d = parseISODate(iso)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function monthRange(year, monthIndex) {
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)
  return { start: toISODate(start), end: toISODate(end) }
}

export function shortMonth(year, monthIndex) {
  return new Date(year, monthIndex, 1)
    .toLocaleString('en-US', { month: 'short' })
}

export function isWithinMonths(iso, monthsBack) {
  const date = parseISODate(iso)
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)
  return date >= cutoff
}

export function filterByRange(records, range) {
  if (range === 'ALL') return records
  const months = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[range] || 1
  return records.filter((r) => isWithinMonths(r.date, months))
}
