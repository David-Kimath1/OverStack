import { getMonthBucket } from './dateUtils'

export function sumForGoal(savings, goalId) {
  return savings
    .filter((s) => s.goalId === goalId)
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
}

export function sumAll(savings) {
  return savings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
}

export function sumForMonth(savings, year, monthIndex) {
  return savings
    .filter((s) => {
      const b = getMonthBucket(s.date)
      return b.year === year && b.month === monthIndex
    })
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
}

export function goalStats(goal, savings) {
  const saved = sumForGoal(savings, goal.id)
  const target = Number(goal.targetAmount) || 0
  const percent = target > 0 ? (saved / target) * 100 : 0
  const remaining = Math.max(target - saved, 0)
  const completed = target > 0 && saved >= target
  return {
    saved,
    target,
    percent,
    remaining,
    completed,
    overflow: Math.max(saved - target, 0),
  }
}

export function splitGoals(goals, savings) {
  const active = []
  const completed = []
  for (const g of goals) {
    const stats = goalStats(g, savings)
    if (stats.completed) completed.push({ goal: g, stats })
    else active.push({ goal: g, stats })
  }
  return { active, completed }
}

export function cumulativeSeries(records) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  let total = 0
  return sorted.map((r) => {
    total += Number(r.amount) || 0
    return { date: r.date, total, amount: Number(r.amount) || 0 }
  })
}

export function monthlyHistory(savings, monthsBack = 6) {
  const now = new Date()
  const buckets = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      total: 0,
    })
  }
  for (const s of savings) {
    const b = getMonthBucket(s.date)
    const match = buckets.find((x) => x.year === b.year && x.month === b.month)
    if (match) match.total += Number(s.amount) || 0
  }
  return buckets
}
