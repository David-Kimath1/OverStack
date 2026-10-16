import { useCallback, useEffect, useState } from 'react'
import {
  listGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../storage/goalStorage'
import { deleteSavingsByGoal } from '../storage/savingsStorage'

export function useGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const rows = await listGoals()
      setGoals(rows)
      return rows
    } catch (e) {
      setError(e.message || 'Failed to load goals')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addGoal = useCallback(async (data) => {
    const g = await createGoal(data)
    await refresh()
    return g
  }, [refresh])

  const editGoal = useCallback(async (id, patch) => {
    const g = await updateGoal(id, patch)
    await refresh()
    return g
  }, [refresh])

  const removeGoal = useCallback(async (id) => {
    await deleteGoal(id)
    await deleteSavingsByGoal(id)
    await refresh()
  }, [refresh])

  return { goals, loading, error, refresh, addGoal, editGoal, removeGoal }
}
