const MEDIA = '(prefers-color-scheme: dark)'

export function applyTheme(pref) {
  const root = document.documentElement
  const meta = document.querySelector('meta[name="theme-color"]')
  
  let isDark = false
  if (pref === 'system') {
    isDark = window.matchMedia(MEDIA).matches
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  } else {
    isDark = pref === 'dark'
    root.setAttribute('data-theme', pref)
  }

  // Update the mobile status bar color dynamically
  if (meta) {
    meta.setAttribute('content', isDark ? '#0E1626' : '#F7F9FC')
  }
}
