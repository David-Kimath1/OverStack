import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Sun, Moon, Monitor, Target, Flame, Download, Upload,
  Trash2, Save, Check, AlertCircle, FileText, EyeOff, Bell, Fingerprint, History, Smartphone
} from 'lucide-react'
import AppHeader from '../components/AppHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { getAllSettings, setSetting } from '../storage/settingsStorage'
import { exportAllData, importAllData, validateImport, deleteAllData } from '../storage/exportImport'
import { createGoal } from '../storage/goalStorage'
import { createSaving } from '../storage/savingsStorage'
import { SUPPORTED_CURRENCIES, currencySymbol, formatThousands } from '../utils/currency'
import { applyTheme } from '../utils/themeApplier'
import { exportPdfReport } from '../utils/pdfExport'
import { requestNotificationPermission, sendTestNotification } from '../utils/notifications'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { useBiometrics } from '../hooks/useBiometrics'
import './Profile.css'

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark',  label: 'Dark',  icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

const CURRENT_YEAR = new Date().getFullYear()

export default function Profile() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [error, setError] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [theme, setThemeState] = useState('system')
  const [privacyMode, setPrivacyMode] = useState('dots')
  
  const [nameDraft, setNameDraft] = useState('')
  const [currencyDraft, setCurrencyDraft] = useState('KSh')
  const [yearlyTargetDraft, setYearlyTargetDraft] = useState('')
  const [streakTokens, setStreakTokens] = useState(3)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)

  const [bioErrorOpen, setBioErrorOpen] = useState(false)
  const [bioErrorMsg, setBioErrorMsg] = useState('')

  const { goals, refresh: refreshGoals } = useGoals()
  const { savings, refresh: refreshSavings } = useSavings()
  const { isEnabled, enableBiometrics, disableBiometrics } = useBiometrics()

  const fileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = await getAllSettings()
      if (cancelled) return
      setNameDraft(s.displayName || '')
      setCurrencyDraft(s.currency || 'KSh')
      setYearlyTargetDraft(String(s.yearlyTargets?.[CURRENT_YEAR] || 80000))
      setThemeState(s.theme || 'system')
      setPrivacyMode(s.privacyMode || 'dots')
      setStreakTokens(Number.isFinite(s.streakTokens) ? s.streakTokens : 3)
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  // Auto-save logic
  useEffect(() => {
    if (!ready) return
    const target = Number(yearlyTargetDraft.replace(/,/g, ''))
    if (!Number.isFinite(target) || target <= 0) return
    const timer = setTimeout(async () => {
      const s = await getAllSettings()
      const newTargets = { ...(s.yearlyTargets || {}), [CURRENT_YEAR]: target }
      await setSetting('yearlyTargets', newTargets)
    }, 800)
    return () => clearTimeout(timer)
  }, [yearlyTargetDraft, ready])

  useEffect(() => {
    if (!ready) return
    if (!nameDraft.trim()) return
    const timer = setTimeout(async () => { await setSetting('displayName', nameDraft.trim()) }, 800)
    return () => clearTimeout(timer)
  }, [nameDraft, ready])

  useEffect(() => {
    if (!ready) return
    setSetting('currency', currencyDraft)
  }, [currencyDraft, ready])

  async function saveProfile() {
    setError(null)
    try {
      if (nameDraft.trim()) await setSetting('displayName', nameDraft.trim())
      await setSetting('currency', currencyDraft)
      
      const target = Number(yearlyTargetDraft.replace(/,/g, ''))
      if (Number.isFinite(target) && target > 0) {
        const s = await getAllSettings()
        const newTargets = { ...(s.yearlyTargets || {}), [CURRENT_YEAR]: target }
        await setSetting('yearlyTargets', newTargets)
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

  async function changePrivacy(mode) {
    setPrivacyMode(mode)
    await setSetting('privacyMode', mode)
    if (mode !== 'none') {
      await setSetting('balanceHidden', true)
    }
  }

  async function handleBiometrics() {
    if (isEnabled) {
      await disableBiometrics()
    } else {
      const success = await enableBiometrics()
      if (!success) {
        setBioErrorMsg("Biometrics are not supported on this device or browser, or the prompt was cancelled. Please ensure you have a fingerprint/FaceID scanner set up.")
        setBioErrorOpen(true)
      }
    }
  }

  async function handleExport() {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `overstack-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (e) { setError(e.message || 'Export failed.') }
  }

  async function handleExportPdf() {
    setPdfLoading(true); setError(null)
    try {
      await exportPdfReport({ goals, savings, currency: currencyDraft, displayName: nameDraft || 'You' })
    } catch (e) { setError(e.message || 'PDF export failed.') } finally { setPdfLoading(false) }
  }

  function handleImportClick() { setImportError(null); setImportSuccess(null); fileRef.current?.click() }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null); setImportSuccess(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const err = validateImport(data)
      if (err) throw new Error(err)
      
      // Replace entire database with the new file
      await importAllData(data, { replace: true })
      setImportSuccess('Data imported successfully! Reloading...')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) { setImportError(err.message || 'Import failed.') } finally { if (fileRef.current) fileRef.current.value = '' }
  }

  async function handleDeleteAll() {
    await deleteAllData(); setDeleteOpen(false); navigate('/'); setTimeout(() => window.location.reload(), 300)
  }

  // --- SYSTEM INITIALIZER ---
  async function handleInitializeSystem() {
    try {
      // 1. Create the Insurance Goal
      let insGoal = goals.find(g => g.name.toLowerCase().includes('insurance'))
      if (!insGoal) {
        insGoal = await createGoal({ name: 'Insurance Fund', targetAmount: 320427 })
      }
      
      // 2. Add the 3 past payments
      const year = new Date().getFullYear()
      const pastMonths = [`${year}-08-01`, `${year}-09-01`, `${year}-10-01`]
      for (const dateStr of pastMonths) {
        const exists = savings.some(s => s.goalId === insGoal.id && s.date === dateStr)
        if (!exists) {
          await createSaving({ 
            goalId: insGoal.id, 
            amount: 3008, 
            date: dateStr, 
            note: 'Insurance auto-deduction' 
          })
        }
      }

      // 3. Set default income
      await setSetting('monthlyIncome', 24000)

      await refreshGoals()
      await refreshSavings()
      setImportSuccess('System initialized! Insurance is ready.')
      setTimeout(() => setImportSuccess(null), 3000)
    } catch (err) {
      setImportError('Failed to initialize system data.')
    }
  }

  if (!ready) return <><AppHeader title="Profile" /><p className="prof__loading">Loading…</p></>

  return (
    <>
      <AppHeader title="Profile" subtitle="Your preferences and data" />

      <section className="prof__card">
        <div className="prof__avatar">{(nameDraft || 'U').trim().charAt(0).toUpperCase()}</div>
        <div className="prof__identity">
          <p className="prof__identity-name">{nameDraft || 'Unnamed'}</p>
          <p className="prof__identity-sub">{currencySymbol(currencyDraft)} · {CURRENT_YEAR} target {formatThousands(yearlyTargetDraft)}</p>
        </div>
      </section>

      <button className="prof__data-btn" onClick={() => navigate('/history')} style={{ marginBottom: '16px', background: 'var(--color-card)' }}>
        <History size={16} />
        <span>
          <strong>View History</strong>
          <em>See all your past savings</em>
        </span>
      </button>

      <section className="prof__card">
        <p className="prof__eyebrow"><User size={13} /> PROFILE</p>
        <label className="prof__label">DISPLAY NAME</label>
        <input className="prof__input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={32} placeholder="Your name" />
        <label className="prof__label" style={{ marginTop: 12 }}>CURRENCY</label>
        <select className="prof__input" value={currencyDraft} onChange={(e) => setCurrencyDraft(e.target.value)}>
          {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c} · {currencySymbol(c)}</option>)}
        </select>
        <label className="prof__label" style={{ marginTop: 12 }}>{CURRENT_YEAR} SAVINGS TARGET</label>
        <input className="prof__input" inputMode="decimal" value={formatThousands(yearlyTargetDraft)} onChange={(e) => {
            const v = e.target.value.replace(/,/g, '')
            if (/^\d*\.?\d{0,2}$/.test(v)) setYearlyTargetDraft(v)
          }} placeholder="80,000" />
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow"><Sun size={13} /> APPEARANCE</p>
        <div className="prof__themes">
          {THEMES.map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} type="button" className={'prof__theme' + (theme === t.id ? ' is-active' : '')} onClick={() => changeTheme(t.id)}>
                <Icon size={16} />{t.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow"><EyeOff size={13} /> PRIVACY & SECURITY</p>
        <p className="prof__data-note" style={{ marginBottom: 16 }}>Choose how your total savings is hidden when you tap the eye icon.</p>
        <div className="prof__themes" style={{ marginBottom: 16 }}>
          {[
            { id: 'none', label: 'Visible' },
            { id: 'blur', label: 'Blur' },
            { id: 'stars', label: 'Stars (***)' },
            { id: 'dots', label: 'Dots (•••)' }
          ].map((mode) => (
            <button key={mode.id} type="button" className={'prof__theme' + (privacyMode === mode.id ? ' is-active' : '')} onClick={() => changePrivacy(mode.id)}>
              {mode.label}
            </button>
          ))}
        </div>
        
        <button 
          className={'prof__data-btn' + (isEnabled ? ' prof__data-btn--danger' : '')} 
          onClick={handleBiometrics}
        >
          <Fingerprint size={16} />
          <span>
            <strong>{isEnabled ? 'Disable Biometric Lock' : 'Enable Biometric Lock'}</strong>
            <em>{isEnabled ? 'Currently protecting your app' : 'Use FaceID / Fingerprint to unlock'}</em>
          </span>
        </button>
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow"><Bell size={13} /> NOTIFICATIONS</p>
        <p className="prof__data-note">Test your browser's local notification system. (Requires permission).</p>
        <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={async () => {
            try { await requestNotificationPermission(); await sendTestNotification() } catch (err) { alert(err.message) }
          }}>
          <Bell size={16} /> Send Test Notification
        </button>
      </section>

      <section className="prof__card">
        <p className="prof__eyebrow"><Target size={13} /> DATA & SYNC</p>
        
        <div style={{ background: 'rgba(72, 169, 230, 0.1)', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(72, 169, 230, 0.2)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ocean-deep)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={14} /> How to sync Laptop & Phone
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
            1. Click <strong>Export Data</strong> on this device.<br/>
            2. Send the `.json` file to yourself (WhatsApp/Email).<br/>
            3. Open OverStack on the other device and click <strong>Import Data</strong>.
          </p>
        </div>

        {/* SYSTEM INITIALIZER BUTTON */}
        <button className="prof__data-btn prof__data-btn--glow" onClick={handleInitializeSystem} style={{ marginBottom: "12px" }}>
          <div className="init-loader"><div className="circle"><div className="dot"></div><div className="outline"></div></div></div>
          <span>
            <strong style={{ color: 'var(--color-primary)' }}>Initialize Base System Data</strong>
            <em>Sets up Insurance & Monthly Savings</em>
          </span>
        </button>

        <div className="prof__data-actions">
          <button className="prof__data-btn" onClick={handleExport}><Download size={16} /><span><strong>Export Data (JSON)</strong><em>Download a backup or sync file</em></span></button>
          <button className="prof__data-btn" onClick={handleImportClick}><Upload size={16} /><span><strong>Import Data (JSON)</strong><em>Restore or sync from a file</em></span></button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleImportFile} />
          
          <button className="prof__data-btn" onClick={handleExportPdf} disabled={pdfLoading}><FileText size={16} /><span><strong>{pdfLoading ? 'Generating PDF…' : 'Export PDF report'}</strong><em>A formatted savings summary, ready to print</em></span></button>
          <button className="prof__data-btn prof__data-btn--danger" onClick={() => setDeleteOpen(true)}><Trash2 size={16} /><span><strong>Delete all data</strong><em>Permanently erase everything</em></span></button>
        </div>
        {importSuccess && <p className="prof__msg prof__msg--ok"><Check size={14} /> {importSuccess}</p>}
        {importError && <p className="prof__msg prof__msg--err"><AlertCircle size={14} /> {importError}</p>}
      </section>

      <div className="prof__savebar">
        {error && <p className="prof__msg prof__msg--err"><AlertCircle size={14} /> {error}</p>}
        {savedAt && <p className="prof__msg prof__msg--ok"><Check size={14} /> Saved</p>}
        <button className="btn btn--primary prof__save" onClick={saveProfile}><Save size={16} /> Save changes</button>
      </div>

      <Modal
        open={bioErrorOpen}
        onClose={() => setBioErrorOpen(false)}
        title="Biometrics Unavailable"
        footer={<button className="btn btn--primary" onClick={() => setBioErrorOpen(false)}>Okay</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', padding: '10px 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(217, 63, 63, 0.1)', color: '#D93F3F', display: 'grid', placeItems: 'center' }}>
            <Fingerprint size={24} />
          </div>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '14px', lineHeight: 1.5 }}>
            {bioErrorMsg}
          </p>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} onCancel={() => setDeleteOpen(false)} onConfirm={handleDeleteAll} title="Delete all data?" message="Every goal, every savings record, and all preferences will be permanently erased from this browser. This cannot be undone." confirmLabel="Delete everything" destructive />
    </>
  )
}
