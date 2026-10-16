import { useCallback, useEffect, useState } from 'react'
import { getSetting, setSetting } from '../storage/settingsStorage'
import { applyTheme } from '../utils/themeApplier'

const MEDIA = '(prefers-color-scheme: dark)'

export function useTheme() {
  const [theme, setThemeState] = useState('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = (await getSetting('theme')) || 'system'
      if (cancelled) return
      setThemeState(stored)
      applyTheme(stored)
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready) return
    const mq = window.matchMedia(MEDIA)
    const handler = () => {
      if (theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme, ready])

  const setTheme = useCallback(async (next) => {
    setThemeState(next)
    applyTheme(next)
    await setSetting('theme', next)
  }, [])

  return { theme, setTheme, ready }
}
