import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import './AppHeader.css'

export default function AppHeader({ title, subtitle, right }) {
  const { theme, setTheme } = useTheme()

  function cycleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  const isDark = theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <header className="hdr">
      <div className="hdr__left">
        {title && <h1 className="hdr__title">{title}</h1>}
        {subtitle && <p className="hdr__subtitle">{subtitle}</p>}
      </div>
      <div className="hdr__right">
        {right}
        <button
          className="hdr__theme"
          onClick={cycleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
