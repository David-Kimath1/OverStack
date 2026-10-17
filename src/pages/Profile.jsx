import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User, Sun, Moon, Monitor, Target, Flame, Download, Upload,
  Trash2, Save, Check, AlertCircle, FileText, Bell,
} from 'lucide-react'
import AppHeader from '../components/AppHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { getAllSettings, setSetting } from '../storage/settingsStorage'
import { exportAllData, importAllData, validateImport, deleteAllData } from '../storage/exportImport'
import { SUPPORTED_CURRENCIES, currencySymbol, formatThousands } from '../utils/currency'
import { applyTheme } from '../utils/themeApplier'
import { exportPdfReport } from '../utils/pdfExport'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import './Profile.css'
import { requestNotificationPermission, sendTestNotification } from '../utils/notifications'


const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark',  label: 'Dark',  icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

export default function Profile() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [theme, setThemeState] = useState('system')
  const [nameDraft, setNameDraft] = useState('')
  const [currencyDraft, setCurrencyDraft] = useState('KSh')
  const [monthlyTargetDraft, setMonthlyTargetDraft] = useState('')
  const [streakTokens, setStreakTokens] = useState(3)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)

  const { goals } = useGoals()
  const { savings } = useSavings()

  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = await getAllSettings()
      if (cancelled) return
      setNameDraft(s.displayName || '')
      setCurrencyDraft(s.currency || 'KSh')
      setMonthlyTargetDraft(String(s.monthlyTarget ?? 20000))
      setThemeState(s.theme || 'system')
      setStreakTokens(Number.isFinite(s.streakTokens) ? s.streakTokens : 3)
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  async function saveProfile() {
    setError(null)
    try {
      if (nameDraft.trim()) await setSetting('displayName', nameDraft.trim())
      await setSetting('currency', currencyDraft)
      const target = Number(monthlyTargetDraft.replace(/,/g, ''))
      if (Number.isFinite(target) && target > 0) {
        await setSetting('monthlyTarget', target)
      }
      setSavedAt(Date.now())
      setTimeout(() => setSavedAt(null), 2000)
    } catch (e) {
      setError(e.message || 'Could not save profile.')
    }
  }

  async function changeTheme(id) {
    setThemeState(id)
    applyTheme(id)
    await setSetting('theme', id)
  }

  async function handleExport() {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `overstack-backup-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Export failed.')
    }
  }

  async function handleExportPdf() {
    setPdfLoading(true)
    setError(null)
    try {
      await exportPdfReport({
        goals,
        savings,
        currency: currencyDraft,
        displayName: nameDraft || 'You',
      })
    } catch (e) {
      setError(e.message || 'PDF export failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  function handleImportClick() {
    setImportError(null)
    setImportSuccess(null)
    fileRef.current?.click()
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const err = validateImport(data)
      if (err) throw new Error(err)
      await importAllData(data, { replace: true })
      setImportSuccess('Data imported successfully.')
      setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      setImportError(err.message || 'Import failed.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDeleteAll() {
    await deleteAllData()
    setDeleteOpen(false)
    navigate('/')
    setTimeout(() => window.location.reload(), 300)
  }

  if (!ready) {
    return (
      <>
        <AppHeader title="Profile" />
        <p className="prof__loading">Loading…</p>
      </>
    )
  }

  return (
    <>
      <AppHeader title="Profile" subtitle="Your preferences and data" />

      <section className="prof__card">
        <div className="prof__avatar">
          {(nameDraft || 'U').trim().charAt(0).toUpperCase()}
        </div>
        <div className="prof__identity">
          <p className="prof__identity-name">{nameDraft || 'Unnamed'}</p>
          <p className="prof__identity-sub">
            {currencySymbol(currencyDraft)} · Monthly target {formatThousands(monthlyTargetDraft)}
          </p>
        </div>
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow">
          <User size={13} /> PROFILE
        </p>

        <label className="prof__label">DISPLAY NAME</label>
        <input
          className="prof__input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          maxLength={32}
          placeholder="Your name"
        />

        <label className="prof__label" style={{ marginTop: 12 }}>
          CURRENCY
        </label>
        <select
          className="prof__input"
          value={currencyDraft}
          onChange={(e) => setCurrencyDraft(e.target.value)}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c} · {currencySymbol(c)}
            </option>
          ))}
        </select>

        <label className="prof__label" style={{ marginTop: 12 }}>
          MONTHLY SAVINGS TARGET
        </label>
        <input
          className="prof__input"
          inputMode="decimal"
          value={formatThousands(monthlyTargetDraft)}
          onChange={(e) => {
            const v = e.target.value.replace(/,/g, '')
            if (/^\d*\.?\d{0,2}$/.test(v)) setMonthlyTargetDraft(v)
          }}
          placeholder="20,000"
        />
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow">
          <Sun size={13} /> APPEARANCE
        </p>
        <div className="prof__themes">
          {THEMES.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                className={'prof__theme' + (theme === t.id ? ' is-active' : '')}
                onClick={() => changeTheme(t.id)}
              >
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow">
          <Bell size={13} /> NOTIFICATIONS
        </p>
        <p className="prof__data-note">
          Test your browser's local notification system. (Requires permission).
        </p>
        <button 
          className="btn btn--primary" 
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={async () => {
            try {
              await requestNotificationPermission()
              await sendTestNotification()
            } catch (err) {
              alert(err.message)
            }
          }}
        >
          <Bell size={16} /> Send Test Notification
        </button>
      </section>
      <section className="prof__card">
        <p className="prof__eyebrow">
          <Flame size={13} /> STREAK
        </p>
        <div className="prof__streak">
          <div className="prof__streak-icon">
            <Flame size={20} />
          </div>
          <div>
            <p className="prof__streak-title">
              {streakTokens} restore token{streakTokens === 1 ? '' : 's'} left
            </p>
            <p className="prof__streak-sub">
              Use a token to repair a month you missed. Restoring a missed month
              requires that month's savings target; missing two months in a row
              doubles the cost.
            </p>
          </div>
        </div>
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow">
          <Target size={13} /> DATA
        </p>

        <p className="prof__data-note">
          Your data is stored locally in this browser. Export a backup regularly.
          Clearing browser site data will erase everything.
        </p>

        <div className="prof__data-actions">
          <button
            className="prof__data-btn"
            onClick={handleExportPdf}
            disabled={pdfLoading}
          >
            <FileText size={16} />
            <span>
              <strong>{pdfLoading ? 'Generating PDF…' : 'Export PDF report'}</strong>
              <em>A formatted savings summary, ready to print</em>
            </span>
          </button>

          <button className="prof__data-btn" onClick={handleExport}>
            <Download size={16} />
            <span>
              <strong>Export data</strong>
              <em>Download a JSON backup</em>
            </span>
          </button>

          <button className="prof__data-btn" onClick={handleImportClick}>
            <Upload size={16} />
            <span>
              <strong>Import data</strong>
              <em>Restore from a backup file</em>
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />

          <button
            className="prof__data-btn prof__data-btn--danger"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={16} />
            <span>
              <strong>Delete all data</strong>
              <em>Permanently erase everything</em>
            </span>
          </button>
        </div>

        {importSuccess && (
          <p className="prof__msg prof__msg--ok">
            <Check size={14} /> {importSuccess}
          </p>
        )}
        {importError && (
          <p className="prof__msg prof__msg--err">
            <AlertCircle size={14} /> {importError}
          </p>
        )}
      </section>

      <div className="prof__savebar">
        {error && (
          <p className="prof__msg prof__msg--err">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        {savedAt && (
          <p className="prof__msg prof__msg--ok">
            <Check size={14} /> Saved
          </p>
        )}
        <button className="btn btn--primary prof__save" onClick={saveProfile}>
          <Save size={16} /> Save changes
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete all data?"
        message="Every goal, every savings record, and all preferences will be permanently erased from this browser. This cannot be undone."
        confirmLabel="Delete everything"
        destructive
      />
    </>
  )
}