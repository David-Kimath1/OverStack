import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Flame, ArrowRight, Plus, FileText, Eye, EyeOff, Calendar } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import OceanProgress from '../components/OceanProgress'
import GoalCard from '../components/GoalCard'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalFormModal from '../components/GoalFormModal'
import IncomeCard from '../components/IncomeCard'
import InsuranceCard from '../components/InsuranceCard'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { useStreak } from '../hooks/useStreak'
import { getAllSettings, setSetting } from '../storage/settingsStorage'
import { createGoal } from '../storage/goalStorage'
import { exportPdfReport } from '../utils/pdfExport'
import { sumAll, sumForMonth, splitGoals } from '../utils/savingsCalculations'
import { formatCurrency, currencySymbol } from '../utils/currency'
import { formatMonthOnly, todayISO } from '../utils/dateUtils'
import './Home.css'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function detectLocale() {
  if (typeof navigator === 'undefined') return undefined
  return navigator.language || undefined
}

function formatClock(d, locale) {
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', second: '2-digit' })
}

function formatFullDate(d, locale) {
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTimezone(d, locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZoneName: 'short' }).formatToParts(d)
    const tz = parts.find((p) => p.type === 'timeZoneName')
    return tz ? tz.value : ''
  } catch { return '' }
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function Home() {
  const { goals, refresh: refreshGoals, loading: goalsLoading, addGoal, editGoal, removeGoal } = useGoals()
  const { savings, refresh: refreshSavings, loading: savingsLoading, addSaving, removeSaving } = useSavings()
  const streak = useStreak(savings, goals)
  const now = useNow(1000)
  const locale = detectLocale()
  const currentYear = now.getFullYear()

  const [settings, setSettings] = useState({
    displayName: 'Dave',
    currency: 'KSh',
    activeGoalId: null,
    yearlyTargets: {},
    monthlyIncome: 0,
    privacyMode: 'dots',
    balanceHidden: true,
  })
  
  const [ready, setReady] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [randomMode, setRandomMode] = useState('dots')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = await getAllSettings()
      if (cancelled) return
      setSettings(s)
      await Promise.all([refreshGoals(), refreshSavings()])
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (settings.balanceHidden && settings.privacyMode === 'none') {
      const modes = ['blur', 'stars', 'dots']
      setRandomMode(modes[Math.floor(Math.random() * modes.length)])
    }
  }, [settings.balanceHidden, settings.privacyMode])

  const insuranceGoal = goals.find(g => g.name.toLowerCase().includes('insurance'))
  const monthlySavingsGoal = goals.find(g => g.name === 'Monthly Savings' || g.name === 'General Savings')
  
  // 1. ALL SAVINGS (For Total Saved & Stats)
  const validSavings = useMemo(() => {
    return savings.filter(s => s.goalId !== insuranceGoal?.id)
  }, [savings, insuranceGoal])

  const total = useMemo(() => sumAll(validSavings), [validSavings])
  
  const displayGoals = useMemo(() => {
    return goals.filter(g => g.id !== insuranceGoal?.id && g.id !== monthlySavingsGoal?.id)
  }, [goals, insuranceGoal, monthlySavingsGoal])

  const { active, completed } = useMemo(() => splitGoals(displayGoals, savings), [displayGoals, savings])

  const activeGoal = useMemo(() => {
    if (!displayGoals.length) return null
    const preferred = settings.activeGoalId ? active.find((a) => a.goal.id === settings.activeGoalId) : null
    return preferred || active[0] || completed[0] || null
  }, [displayGoals, active, completed, settings.activeGoalId])

  // 2. MONTHLY SAVINGS FOR CURRENT MONTH (For Monthly Budget Card)
  const currentMonthMonthlySavings = useMemo(() => {
    if (!monthlySavingsGoal) return 0
    return sumForMonth(
      validSavings.filter(s => s.goalId === monthlySavingsGoal.id), 
      currentYear, 
      now.getMonth()
    )
  }, [validSavings, monthlySavingsGoal, currentYear, now])

  // 3. TOTAL MONTHLY SAVINGS FOR ENTIRE YEAR (For Yearly Progress Card)
  const totalMonthlySavingsThisYear = useMemo(() => {
    if (!monthlySavingsGoal) return 0
    return validSavings
      .filter(s => s.goalId === monthlySavingsGoal.id && new Date(s.date).getFullYear() === currentYear)
      .reduce((sum, s) => sum + Number(s.amount), 0)
  }, [validSavings, monthlySavingsGoal, currentYear])

  const yearlyTarget = settings.yearlyTargets?.[currentYear] || 80000
  const yearPct = yearlyTarget > 0 ? (totalMonthlySavingsThisYear / yearlyTarget) * 100 : 0

  const pastYears = useMemo(() => {
    const yearsMap = new Map()
    validSavings.forEach(s => {
      const y = new Date(s.date).getFullYear()
      if (y < currentYear) {
        yearsMap.set(y, (yearsMap.get(y) || 0) + Number(s.amount))
      }
    })
    return Array.from(yearsMap.entries())
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => b.year - a.year)
  }, [validSavings, currentYear])

  const monthlyBreakdown = useMemo(() => {
    const months = []
    const currentMonth = now.getMonth()
    let startMonth = currentMonth

    const monthlySavings = validSavings.filter(s => s.goalId === monthlySavingsGoal?.id)

    if (monthlySavings.length > 0) {
      const dates = monthlySavings.map(s => new Date(s.date).getTime())
      const minDate = new Date(Math.min(...dates))
      startMonth = minDate.getMonth()
    }

    let loopMonth = startMonth
    while (loopMonth <= currentMonth) {
      const totalForMonth = sumForMonth(monthlySavings, currentYear, loopMonth)
      months.push({
        label: new Date(currentYear, loopMonth, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        amount: totalForMonth,
        isCurrent: loopMonth === currentMonth
      })
      loopMonth++
    }
    
    if (months.length === 0) {
        months.push({
          label: new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          amount: 0,
          isCurrent: true
        })
    }

    return months
  }, [validSavings, monthlySavingsGoal, now, currentYear])

  const loading = goalsLoading || savingsLoading || !ready
  const tz = formatTimezone(now, locale)
  const subtitle = [formatClock(now, locale), formatFullDate(now, locale), tz].filter(Boolean).join(' · ')

  const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const isInsurancePaid = insuranceGoal 
    ? savings.some(s => s.goalId === insuranceGoal.id && s.date.startsWith(currentMonthPrefix))
    : false

  async function handleInsuranceConfirm() {
    let targetGoalId = insuranceGoal?.id
    if (!targetGoalId) {
      const newGoal = await createGoal({ name: 'Insurance Fund', targetAmount: 36000 })
      targetGoalId = newGoal.id
    }
    await addSaving({ goalId: targetGoalId, amount: 3000, date: todayISO(), note: 'Insurance auto-deduction' })
    await refreshGoals()
  }

  async function handleEditMonthlySaving(newTotal) {
    let targetGoalId = monthlySavingsGoal?.id
    if (!targetGoalId) {
      const newGoal = await createGoal({ name: 'Monthly Savings', targetAmount: 100000 })
      targetGoalId = newGoal.id
      await refreshGoals()
    }

    const existing = savings.filter(s => s.goalId === targetGoalId && s.date.startsWith(currentMonthPrefix))
    for (const record of existing) {
      await removeSaving(record.id)
    }
    
    if (newTotal > 0) {
      await addSaving({
        goalId: targetGoalId,
        amount: newTotal,
        date: todayISO(),
        note: 'Monthly saving'
      })
    }
  }

  function openEdit(goal) { setEditing(goal); setFormOpen(true) }

  async function handleCreateOrEdit(data) {
    if (editing) await editGoal(editing.id, data)
    else await addGoal(data)
    await refreshSavings()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await removeGoal(pendingDelete.id)
    await refreshSavings()
    setPendingDelete(null)
  }

  async function handleExportPdf() {
    setPdfLoading(true)
    try {
      await exportPdfReport({ goals, savings, currency: settings.currency || 'KSh', displayName: settings.displayName || 'You' })
    } finally { setPdfLoading(false) }
  }

  async function handleSaveIncome(amount) {
    await setSetting('monthlyIncome', amount)
    setSettings((s) => ({ ...s, monthlyIncome: amount }))
  }

  async function togglePrivacy() {
    const nextHidden = !settings.balanceHidden
    await setSetting('balanceHidden', nextHidden)
    setSettings((s) => ({ ...s, balanceHidden: nextHidden }))
  }

  const privacyMode = settings.privacyMode || 'dots'
  const effectiveMode = privacyMode === 'none' ? randomMode : privacyMode
  const isHidden = settings.balanceHidden
  
  let displayTotal = formatCurrency(total, settings.currency)
  if (isHidden) {
    if (effectiveMode === 'stars') displayTotal = `${currencySymbol(settings.currency)} ******`
    else if (effectiveMode === 'dots') displayTotal = `${currencySymbol(settings.currency)} ••••••`
  }

  return (
    <>
      <AppHeader
        title={`${greeting()}, ${settings.displayName}`}
        subtitle={subtitle}
        right={
          <button className="home__export-btn" onClick={handleExportPdf} disabled={pdfLoading || loading} aria-label="Export PDF report" title="Export PDF report">
            <FileText size={16} />
          </button>
        }
      />

      {/* TOP CARD: ALL SAVINGS COMBINED */}
      <section className="home__total">
        <div className="home__total-head">
          <p className="home__total-label">TOTAL SAVED</p>
          <button className="home__privacy-btn" onClick={togglePrivacy} aria-label={isHidden ? "Show balance" : "Hide balance"}>
            {isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <p className={`home__total-value ${isHidden && effectiveMode === 'blur' ? 'is-blurred' : ''}`}>
          {displayTotal}
        </p>
        <p className="home__total-sub">Across all savings</p>
      </section>

      {!loading && (
        <InsuranceCard 
          amount={3000} 
          isPaid={isInsurancePaid} 
          currency={settings.currency} 
          onConfirm={handleInsuranceConfirm} 
          isHidden={isHidden}
          privacyMode={effectiveMode}
        />
      )}

      {!loading && activeGoal && (
        <section className="home__section">
          <div className="home__section-head">
            <p className="home__eyebrow">ACTIVE GOAL</p>
            <Link to={`/goals/${activeGoal.goal.id}`} className="home__more">Details <ArrowRight size={14} /></Link>
          </div>
          <div className="home__active">
            <div className="home__active-head">
              <h2 className="home__active-name">{activeGoal.goal.name}</h2>
              <span className="home__active-pct">{Math.round(activeGoal.stats.percent)}% saved</span>
            </div>
            <div className="home__active-bar">
              <OceanProgress value={activeGoal.stats.percent} size="lg" completed={activeGoal.stats.completed} showPercent />
            </div>
            <div className="home__active-row">
              <span className="home__active-saved">{formatCurrency(activeGoal.stats.saved, settings.currency)}</span>
              <span className="home__active-of">of {formatCurrency(activeGoal.stats.target, settings.currency)}</span>
            </div>
            {!activeGoal.stats.completed && (
              <p className="home__active-remain">{formatCurrency(activeGoal.stats.remaining, settings.currency)} remaining</p>
            )}
          </div>
        </section>
      )}

      {!loading && streak.ready && streak.currentStreak > 0 && (
        <Link to="/streak" className="home__streak" aria-label="Savings streak">
          <div className="home__streak-icon" aria-hidden="true"><Flame size={22} /></div>
          <div className="home__streak-text">
            <p className="home__streak-num">{streak.currentStreak} month{streak.currentStreak === 1 ? '' : 's'} streak</p>
            <p className="home__streak-sub">Keep saving every month to grow it{streak.missedMonths.length > 0 && (<> · {streak.missedMonths.length} month{streak.missedMonths.length === 1 ? '' : 's'} missed</>)}</p>
          </div>
          <ArrowRight size={16} className="home__streak-arrow" />
        </Link>
      )}

      <section className="home__section">
        <div className="home__section-head">
          <p className="home__eyebrow">MY GOALS</p>
          <Link to="/goals" className="home__more">View all <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <p className="home__placeholder">Loading…</p>
        ) : displayGoals.length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" message="Create your first savings goal and watch the water rise." action={<Link to="/goals" className="btn btn--primary"><Plus size={16} /> Add a goal</Link>} />
        ) : (
          <div className="home__grid">
            {active.slice(0, 4).map(({ goal, stats }) => (
              <GoalCard key={goal.id} goal={goal} stats={stats} currency={settings.currency} onEdit={openEdit} onDelete={setPendingDelete} />
            ))}
          </div>
        )}
      </section>

      {/* MONTHLY BUDGET CARD: MONTHLY SAVINGS ONLY */}
      {!loading && (
        <IncomeCard 
          income={settings.monthlyIncome || 0} 
          savedThisMonth={currentMonthMonthlySavings} 
          monthlyTarget={settings.monthlyIncome ? settings.monthlyIncome - currentMonthMonthlySavings : 0} 
          currency={settings.currency} 
          monthLabel={formatMonthOnly(currentYear, now.getMonth())} 
          onSaveIncome={handleSaveIncome} 
          onEditSaving={handleEditMonthlySaving} 
        />
      )}

      {/* YEARLY PROGRESS CARD: MONTHLY SAVINGS ONLY */}
      <section className="home__section">
        <div className="home__section-head">
          <p className="home__eyebrow">YEARLY PROGRESS</p>
        </div>
        <div className="home__month">
          <div className="home__month-head">
            <span className="home__month-name">{currentYear}</span>
            <span className="home__month-pct">{Math.round(yearPct)}% achieved</span>
          </div>
          <p className="home__month-amount">{formatCurrency(totalMonthlySavingsThisYear, settings.currency)} saved</p>
          <div style={{ marginTop: 12 }}>
            <OceanProgress value={yearPct} size="md" showPercent />
          </div>
          <p className="home__month-target">Yearly target: {formatCurrency(yearlyTarget, settings.currency)}</p>

          <div className="home__month-breakdown">
            {monthlyBreakdown.map((m, i) => (
              <div key={i} className={`home__mb-card ${m.isCurrent ? 'is-current' : ''}`}>
                <span className="home__mb-label">{m.label}</span>
                <span className="home__mb-amount">
                  {isHidden ? '•••' : formatCurrency(m.amount, settings.currency).replace(currencySymbol(settings.currency), '').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!loading && pastYears.length > 0 && (
        <section className="home__section">
          <div className="home__section-head">
            <p className="home__eyebrow">PAST YEARS</p>
          </div>
          <div className="home__past-years">
            {pastYears.map((py) => (
              <div key={py.year} className="home__past-card">
                <div className="home__past-icon"><Calendar size={16} /></div>
                <div>
                  <p className="home__past-year">{py.year}</p>
                  <p className="home__past-amount">{isHidden ? '••••••' : formatCurrency(py.amount, settings.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreateOrEdit} initial={editing} />
      <ConfirmDialog open={!!pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} title="Delete this goal?" message={pendingDelete ? `"${pendingDelete.name}" and all its savings records will be permanently removed. This cannot be undone.` : ''} confirmLabel="Delete goal" destructive />
    </>
  )
}
