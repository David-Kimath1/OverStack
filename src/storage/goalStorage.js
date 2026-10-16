import { getAll, getById, put, remove, clearStore, uid, STORES } from './db'

export async function listGoals() {
  const goals = await getAll(STORES.GOALS)
  return goals.sort((a, b) => a.createdAt - b.createdAt)
}

export async function getGoal(id) {
  return getById(STORES.GOALS, id)
}

export async function createGoal({ name, targetAmount, targetDate = null, description = '' }) {
  if (!name || !name.trim()) throw new Error('Goal name is required')
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
    throw new Error('Target amount must be greater than zero')
  }
  const now = Date.now()
  const goal = {
    id: uid(),
    name: name.trim(),
    targetAmount: Number(targetAmount),
    targetDate: targetDate || null,
    description: description || '',
    createdAt: now,
    updatedAt: now,
  }
  await put(STORES.GOALS, goal)
  return goal
}

export async function updateGoal(id, patch) {
  const existing = await getGoal(id)
  if (!existing) throw new Error('Goal not found')
  const updated = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  await put(STORES.GOALS, updated)
  return updated
}

export async function deleteGoal(id) {
  await remove(STORES.GOALS, id)
}

export async function clearGoals() {
  return clearStore(STORES.GOALS)
}
