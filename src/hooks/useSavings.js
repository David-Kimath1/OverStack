import { useCallback, useEffect, useState } from 'react'
import {
  listSavings,
  createSaving,
  updateSaving,
  deleteSaving,
} from '../storage/savingsStorage'

export function useSavings() {
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const rows = await listSavings()
      setSavings(rows)
      return rows
    } catch (e) {
      setError(e.message || 'Failed to load savings')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addSaving = useCallback(async (data) => {
    const s = await createSaving(data)
    await refresh()
    return s
  }, [refresh])

  const editSaving = useCallback(async (id, patch) => {
    const s = await updateSaving(id, patch)
    await refresh()
    return s
  }, [refresh])

  const removeSaving = useCallback(async (id) => {
    await deleteSaving(id)
    await refresh()
  }, [refresh])

  return { savings, loading, error, refresh, addSaving, editSaving, removeSaving }
}
