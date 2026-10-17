import { getById, put, getAll, STORES, getDB } from './db'

const DEFAULTS = {
  displayName: 'Dave',
  currency: 'KSh',
  theme: 'system',
  activeGoalId: null,
  yearlyTargets: {}, // e.g. { "2026": 80000, "2027": 100000 }
  monthlyIncome: 0,
  streakTokens: 3,
  privacyMode: 'dots',
  balanceHidden: true,
}

export async function getSetting(key) {
  const row = await getById(STORES.SETTINGS, key)
  if (row) return row.value
  return DEFAULTS[key]
}

export async function setSetting(key, value) {
  await put(STORES.SETTINGS, { key, value })
  return value
}

export async function getAllSettings() {
  const rows = await getAll(STORES.SETTINGS)
  const result = { ...DEFAULTS }
  for (const row of rows) result[row.key] = row.value
  return result
}

export async function clearSettings() {
  const db = await getDB()
  await db.clear(STORES.SETTINGS)
}

export { DEFAULTS }
