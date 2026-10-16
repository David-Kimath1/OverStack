import { listGoals, createGoal } from './goalStorage'
import { createSaving } from './savingsStorage'
import { getSetting, setSetting } from './settingsStorage'
import { toISODate } from '../utils/dateUtils'

let inFlight = null

export function seedDemoDataIfEmpty() {
  if (inFlight) return inFlight
  inFlight = runSeed()
  return inFlight
}

async function runSeed() {
  const seeded = await getSetting('seeded')
  if (seeded) return

  const existingGoals = await listGoals()
  if (existingGoals.length > 0) {
    await setSetting('seeded', true)
    return
  }

  // Mark as seeded FIRST so a racing call bails out immediately
  await setSetting('seeded', true)

  const now = new Date()
  const iso = (y, m, d) => toISODate(new Date(y, m - 1, d))

  const goals = [
    { name: 'New Laptop',     targetAmount: 100000, targetDate: iso(now.getFullYear(), 12, 31), description: 'MacBook Pro for work' },
    { name: 'Emergency Fund', targetAmount: 300000, targetDate: iso(now.getFullYear() + 1, 6, 30), description: '6 months of expenses' },
    { name: 'Car',            targetAmount: 800000, targetDate: iso(now.getFullYear() + 2, 1, 1),  description: 'Down payment' },
    { name: 'Travel',         targetAmount: 150000, targetDate: iso(now.getFullYear() + 1, 3, 15), description: 'Trip to Zanzibar' },
  ]

  const created = []
  for (const g of goals) {
    created.push(await createGoal(g))
  }

  const [laptop, emergency, , travel] = created

  const savings = [
    { goalId: laptop.id,    amount: 5000,  date: iso(now.getFullYear(), now.getMonth() + 1, 3),  note: 'Monthly contribution' },
    { goalId: laptop.id,    amount: 3000,  date: iso(now.getFullYear(), now.getMonth() + 1, 8),  note: 'Freelance payment' },
    { goalId: laptop.id,    amount: 2000,  date: iso(now.getFullYear(), now.getMonth() + 1, 15), note: '' },
    { goalId: laptop.id,    amount: 12000, date: iso(now.getFullYear(), now.getMonth(), 5),      note: 'Last month total' },
    { goalId: laptop.id,    amount: 20500, date: iso(now.getFullYear(), now.getMonth() - 1, 20), note: 'Prior month' },

    { goalId: emergency.id, amount: 1500,  date: iso(now.getFullYear(), now.getMonth() + 1, 12), note: '' },
    { goalId: emergency.id, amount: 8000,  date: iso(now.getFullYear(), now.getMonth(), 10),     note: 'Monthly contribution' },

    { goalId: travel.id,    amount: 2500,  date: iso(now.getFullYear(), now.getMonth() + 1, 6),  note: 'Trip fund' },
  ]

  for (const s of savings) {
    await createSaving(s)
  }

  await setSetting('activeGoalId', laptop.id)
}
