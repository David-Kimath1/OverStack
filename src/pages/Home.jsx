import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Flame, ArrowRight, Plus, FileText } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import OceanProgress from '../components/OceanProgress'
import GoalCard from '../components/GoalCard'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalFormModal from '../components/GoalFormModal'
import IncomeCard from '../components/IncomeCard'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { useStreak } from '../hooks/useStreak'
import { getAllSettings, setSetting } from '../storage/settingsStorage'
import { seedDemoDataIfEmpty } from '../storage/seed'
import { exportPdfReport } from '../utils/pdfExport'
import { sumAll, sumForMonth, splitGoals } from '../utils/savingsCalculations'
import { formatCurrency } from '../utils/currency'
import { formatMonthOnly } from '../utils/dateUtils'
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
  return d.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatFullDate(d, locale) {
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatTimezone(d, locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZoneName: 'short',
    }).formatToParts(d)
    const tz = parts.find((p) => p.type === 'timeZoneName')
    return tz ? tz.value : ''
  } catch {
    return ''
  }
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
  const {
    goals,
    refresh: refreshGoals,
    loading: goalsLoading,
    addGoal,
    editGoal,
    removeGoal,
  } = useGoals()

  const {
    savings,
    refresh: refreshSavings,
    loading: savingsLoading,
  } = useSavings()

  const streak = useStreak(savings, goals)
  const now = useNow(1000)
  const locale = detectLocale()

  const [settings, setSettings] = useState({
    displayName: 'Dave',
    currency: 'KSh',
    activeGoalId: null,
    monthlyTarget: 20000,
    monthlyIncome: 0,
  })
  const [ready, setReady] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await seedDemoDataIfEmpty()
      const s = await getAllSettings()
      if (cancelled) return
      setSettings(s)
      await Promise.all([refreshGoals(), refreshSavings()])
      setReady(true)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = useMemo(() => sumAll(savings), [savings])

  const { active, completed } = useMemo(
    () => splitGoals(goals, savings),
    [goals, savings]
  )

  const activeGoal = useMemo(() => {
    if (!goals.length) return null
    const preferred = settings.activeGoalId
      ? active.find((a) => a.goal.id === settings.activeGoalId)
      : null
    return preferred || active[0] || completed[0] || null
  }, [goals, active, completed, settings.activeGoalId])

  const monthTotal = useMemo(
    () => sumForMonth(savings, now.getFullYear(), now.getMonth()),
    [savings, now]
  )
  const monthTarget = settings.monthlyTarget || 20000
  const monthPct = monthTarget > 0 ? (monthTotal / monthTarget) * 100 : 0

  const loading = goalsLoading || savingsLoading || !ready

  const tz = formatTimezone(now, locale)
  const subtitle = [
    formatClock(now, locale),
    formatFullDate(now, locale),
    tz,
  ].filter(Boolean).join(' · ')

  function openEdit(goal) {
    setEditing(goal)
    setFormOpen(true)
  }

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
      await exportPdfReport({
        goals,
        savings,
        currency: settings.currency || 'KSh',
        displayName: settings.displayName || 'You',
      })
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleSaveIncome(amount) {
    await setSetting('monthlyIncome', amount)
    setSettings((s) => ({ ...s, monthlyIncome: amount }))
  }

  return (
    <>
      <AppHeader
        title={`${greeting()}, ${settings.displayName}`}
        subtitle={subtitle}
        right={
          <button
            className="home__export-btn"
            onClick={handleExportPdf}
            disabled={pdfLoading || loading}
            aria-label="Export PDF report"
            title="Export PDF report"
          >
            <FileText size={16} />
          </button>
        }
      />

      <section className="home__total">
        <p className="home__total-label">TOTAL SAVED</p>
        <p className="home__total-value">
          {formatCurrency(total, settings.currency)}
        </p>
        <p className="home__total-sub">Across all active goals</p>
      </section>

      {!loading && activeGoal && (
        <section className="home__section">
          <div className="home__section-head">
            <p className="home__eyebrow">ACTIVE GOAL</p>
            <Link to={`/goals/${activeGoal.goal.id}`} className="home__more">
              Details <ArrowRight size={14} />
            </Link>
          </div>

          <div className="home__active">
            <div className="home__active-head">
              <h2 className="home__active-name">{activeGoal.goal.name}</h2>
              <span className="home__active-pct">
                {Math.round(activeGoal.stats.percent)}% saved
              </span>
            </div>

            <div className="home__active-bar">
              <OceanProgress
                value={activeGoal.stats.percent}
                size="lg"
                completed={activeGoal.stats.completed}
                showPercent
              />
            </div>

            <div className="home__active-row">
              <span className="home__active-saved">
                {formatCurrency(activeGoal.stats.saved, settings.currency)}
              </span>
              <span className="home__active-of">
                of {formatCurrency(activeGoal.stats.target, settings.currency)}
              </span>
            </div>

            {!activeGoal.stats.completed && (
              <p className="home__active-remain">
                {formatCurrency(activeGoal.stats.remaining, settings.currency)} remaining
              </p>
            )}
          </div>
        </section>
      )}

      {!loading && streak.ready && streak.currentStreak > 0 && (
        <Link to="/streak" className="home__streak" aria-label="Savings streak">
          <div className="home__streak-icon" aria-hidden="true">
            <Flame size={22} />
          </div>
          <div className="home__streak-text">
            <p className="home__streak-num">
              {streak.currentStreak} month{streak.currentStreak === 1 ? '' : 's'} streak
            </p>
            <p className="home__streak-sub">
              Keep saving every month to grow it
              {streak.missedMonths.length > 0 && (
                <> · {streak.missedMonths.length} month{streak.missedMonths.length === 1 ? '' : 's'} missed</>
              )}
            </p>
          </div>
          <ArrowRight size={16} className="home__streak-arrow" />
        </Link>
      )}

      <section className="home__section">
        <div className="home__section-head">
          <p className="home__eyebrow">MY GOALS</p>
          <Link to="/goals" className="home__more">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <p className="home__placeholder">Loading…</p>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            message="Create your first savings goal and watch the water rise."
            action={
              <Link to="/goals" className="btn btn--primary">
                <Plus size={16} /> Add a goal
              </Link>
            }
          />
        ) : (
          <div className="home__grid">
            {active.slice(0, 4).map(({ goal, stats }) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                stats={stats}
                currency={settings.currency}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </section>

      {!loading && (
        <IncomeCard
          income={settings.monthlyIncome || 0}
          savedThisMonth={monthTotal}
          monthlyTarget={monthTarget}
          currency={settings.currency}
          monthLabel={formatMonthOnly(now.getFullYear(), now.getMonth())}
          onSaveIncome={handleSaveIncome}
        />
      )}

      <section className="home__section">
        <div className="home__section-head">
          <p className="home__eyebrow">THIS MONTH</p>
        </div>

        <div className="home__month">
          <div className="home__month-head">
            <span className="home__month-name">
              {formatMonthOnly(now.getFullYear(), now.getMonth())}
            </span>
            <span className="home__month-pct">
              {Math.round(monthPct)}% achieved
            </span>
          </div>

          <p className="home__month-amount">
            {formatCurrency(monthTotal, settings.currency)} saved
          </p>

          <div style={{ marginTop: 12 }}>
            <OceanProgress value={monthPct} size="md" showPercent />
          </div>

          <p className="home__month-target">
            Monthly target: {formatCurrency(monthTarget, settings.currency)}
          </p>
        </div>
      </section>

      <GoalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateOrEdit}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this goal?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" and all its savings records will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete goal"
        destructive
      />
    </>
  )
}
