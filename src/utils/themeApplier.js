const MEDIA = '(prefers-color-scheme: dark)'

export function applyTheme(pref) {
  const root = document.documentElement
  if (pref === 'system') {
    const prefersDark = window.matchMedia(MEDIA).matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', pref)
  }
}
