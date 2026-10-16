import { listGoals, clearGoals } from './goalStorage'
import { listSavings, clearSavings } from './savingsStorage'
import { getAllSettings, clearSettings } from './settingsStorage'
import { put, STORES } from './db'

export async function exportAllData() {
  const [goals, savings, settings] = await Promise.all([
    listGoals(),
    listSavings(),
    getAllSettings(),
  ])
  return {
    app: 'overstack',
    version: 1,
    exportedAt: new Date().toISOString(),
    goals,
    savings,
    settings,
  }
}

export function validateImport(data) {
  if (!data || typeof data !== 'object') return 'File is not a valid JSON object.'
  if (data.app !== 'overstack') return 'This file was not exported by OverStack.'
  if (!Array.isArray(data.goals)) return 'Missing or invalid "goals" array.'
  if (!Array.isArray(data.savings)) return 'Missing or invalid "savings" array.'
  for (const g of data.goals) {
    if (!g.id || !g.name || !Number.isFinite(g.targetAmount)) {
      return 'One or more goals are malformed.'
    }
  }
  for (const s of data.savings) {
    if (!s.id || !s.goalId || !Number.isFinite(s.amount) || !s.date) {
      return 'One or more savings records are malformed.'
    }
  }
  return null
}

export async function importAllData(data, { replace = true } = {}) {
  const err = validateImport(data)
  if (err) throw new Error(err)

  if (replace) {
    await Promise.all([clearGoals(), clearSavings(), clearSettings()])
  }
  for (const g of data.goals) await put(STORES.GOALS, g)
  for (const s of data.savings) await put(STORES.SAVINGS, s)
  if (data.settings && typeof data.settings === 'object') {
    for (const [key, value] of Object.entries(data.settings)) {
      await put(STORES.SETTINGS, { key, value })
    }
  }
}

export async function deleteAllData() {
  await Promise.all([clearGoals(), clearSavings(), clearSettings()])
}
