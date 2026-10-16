import { getAll, put, remove, clearStore, uid, STORES, getDB } from './db'

export async function listSavings() {
  const savings = await getAll(STORES.SAVINGS)
  return savings.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt - a.createdAt
  })
}

export async function listSavingsByGoal(goalId) {
  const db = await getDB()
  const rows = await db.getAllFromIndex(STORES.SAVINGS, 'goalId', goalId)
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

export async function createSaving({ goalId, amount, date, note = '' }) {
  if (!goalId) throw new Error('A goal must be selected')
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }
  if (!date) throw new Error('Date is required')
  const now = Date.now()
  const record = {
    id: uid(),
    goalId,
    amount: Number(amount),
    date, // ISO yyyy-mm-dd
    note: (note || '').trim(),
    createdAt: now,
    updatedAt: now,
  }
  await put(STORES.SAVINGS, record)
  return record
}

export async function updateSaving(id, patch) {
  const db = await getDB()
  const existing = await db.get(STORES.SAVINGS, id)
  if (!existing) throw new Error('Saving not found')
  const updated = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  if (updated.amount != null && (!Number.isFinite(updated.amount) || updated.amount <= 0)) {
    throw new Error('Amount must be greater than zero')
  }
  await put(STORES.SAVINGS, updated)
  return updated
}

export async function deleteSaving(id) {
  await remove(STORES.SAVINGS, id)
}

export async function clearSavings() {
  return clearStore(STORES.SAVINGS)
}

export async function deleteSavingsByGoal(goalId) {
  const db = await getDB()
  const tx = db.transaction(STORES.SAVINGS, 'readwrite')
  const index = tx.store.index('goalId')
  let cursor = await index.openCursor(goalId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}
