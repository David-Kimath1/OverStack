import { getMonthBucket } from './dateUtils'

export function monthsBetween(startISO, endDate = new Date()) {
  const [sy, sm, sd] = startISO.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const out = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  while (cur <= end) {
    out.push({
      year: cur.getFullYear(),
      month: cur.getMonth(),
      key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`,
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return out
}

export function computeStreak({ savings, goals, restorations = {}, now = new Date() }) {
  if (!savings.length) {
    return { currentStreak: 0, missedMonths: [], months: [], activeMonths: [] }
  }
  const sortedAsc = [...savings].sort((a, b) => a.date.localeCompare(b.date))
  const firstDate = sortedAsc[0].date
  const timeline = monthsBetween(firstDate, now)

  const monthTotals = new Map()
  for (const s of savings) {
    const b = getMonthBucket(s.date)
    const key = `${b.year}-${String(b.month + 1).padStart(2, '0')}`
    monthTotals.set(key, (monthTotals.get(key) || 0) + Number(s.amount || 0))
  }

  const months = timeline.map((m) => ({
    ...m,
    total: monthTotals.get(m.key) || 0,
    restored: !!restorations[m.key],
  }))

  const activeMonths = months.filter((m) => m.total > 0 || m.restored)
  const missedMonths = months.filter((m) => m.total === 0 && !m.restored)

  let currentStreak = 0
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  for (let i = months.length - 1; i >= 0; i--) {
    const m = months[i]
    if (m.key === nowKey && m.total === 0 && !m.restored) continue
    if (m.total > 0 || m.restored) currentStreak++
    else break
  }

  return { currentStreak, missedMonths, months, activeMonths }
}

export function restoreCost({ missedKey, months, monthlyTarget = 20000 }) {
  const idx = months.findIndex((m) => m.key === missedKey)
  if (idx < 0) return { cost: monthlyTarget, covers: [missedKey] }
  const covers = [missedKey]
  if (idx > 0) {
    const prev = months[idx - 1]
    if (prev.total === 0 && !prev.restored) {
      covers.unshift(prev.key)
      return { cost: monthlyTarget * 2, covers }
    }
  }
  return { cost: monthlyTarget, covers }
}
