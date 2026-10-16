import { useCallback, useEffect, useState } from 'react'
import { getSetting, setSetting } from '../storage/settingsStorage'
import { computeStreak, restoreCost } from '../utils/streak'

export function useStreak(savings, goals) {
  const [state, setState] = useState({ currentStreak: 0, missedMonths: [], months: [] })
  const [restorations, setRestorations] = useState({})
  const [tokens, setTokens] = useState(3)
  const [monthlyTarget, setMonthlyTarget] = useState(20000)
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    const r = (await getSetting('streakRestorations')) || {}
    const t = (await getSetting('streakTokens')) ?? 3
    const mt = (await getSetting('monthlyTarget')) ?? 20000
    setRestorations(r)
    setTokens(t)
    setMonthlyTarget(mt)
    setState(computeStreak({ savings, goals, restorations: r }))
    setReady(true)
  }, [savings, goals])

  useEffect(() => { load() }, [load])

  const costFor = useCallback(
    (missedKey) => restoreCost({ missedKey, months: state.months, monthlyTarget }),
    [state.months, monthlyTarget]
  )

  const restore = useCallback(async (missedKey) => {
    if (tokens <= 0) throw new Error('No restore tokens left')
    const { cost, covers } = costFor(missedKey)
    const nextRestorations = { ...restorations }
    for (const key of covers) nextRestorations[key] = true
    const nextTokens = tokens - 1
    await setSetting('streakRestorations', nextRestorations)
    await setSetting('streakTokens', nextTokens)
    setRestorations(nextRestorations)
    setTokens(nextTokens)
    setState(computeStreak({ savings, goals, restorations: nextRestorations }))
    return { cost, covers }
  }, [tokens, restorations, costFor, savings, goals])

  return { ...state, tokens, monthlyTarget, ready, costFor, restore, refresh: load }
}
