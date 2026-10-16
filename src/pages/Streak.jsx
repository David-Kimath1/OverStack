import { useEffect, useState } from 'react'
import { Flame, Check, Lock, Sparkles } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { useStreak } from '../hooks/useStreak'
import { getSetting } from '../storage/settingsStorage'
import { formatCurrency } from '../utils/currency'
import './Streak.css'

export default function Streak() {
  const { goals } = useGoals()
  const { savings } = useSavings()
  const streak = useStreak(savings, goals)
  const [currency, setCurrency] = useState('KSh')
  const [pendingRestore, setPendingRestore] = useState(null)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSetting('currency').then((c) => setCurrency(c || 'KSh'))
  }, [])

  function openRestore(month) {
    if (streak.tokens <= 0) return
    setPendingRestore(month)
  }

  async function confirmRestore() {
    if (!pendingRestore) return
    setBusy(true)
    setError(null)
    try {
      const result = await streak.restore(pendingRestore.key)
      setFlash(
        `Restored ${result.covers.length} month${result.covers.length === 1 ? '' : 's'} — ${formatCurrency(result.cost, currency)}`
      )
      setTimeout(() => setFlash(null), 3200)
      setPendingRestore(null)
    } catch (e) {
      setError(e.message || 'Restore failed.')
    } finally {
      setBusy(false)
    }
  }

  const { months } = streak
  const cost = pendingRestore ? streak.costFor(pendingRestore.key) : null

  return (
    <>
      <AppHeader
        title="Savings streak"
        subtitle={`${streak.currentStreak} month${streak.currentStreak === 1 ? '' : 's'} in a row`}
      />

      <section className="str__hero">
        <div className="str__hero-icon"><Flame size={26} /></div>
        <div className="str__hero-text">
          <p className="str__hero-num">
            {streak.currentStreak} month{streak.currentStreak === 1 ? '' : 's'} streak
          </p>
          <p className="str__hero-sub">
            {streak.tokens} restore token{streak.tokens === 1 ? '' : 's'} remaining
          </p>
        </div>
      </section>

      {flash && <p className="str__flash"><Sparkles size={14} /> {flash}</p>}
      {error && <p className="str__error">{error}</p>}

      {!streak.ready ? (
        <p className="str__loading">Loading…</p>
      ) : months.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No streak yet"
          message="Add your first saving to start a streak."
        />
      ) : (
        <section className="str__timeline">
          {[...months].reverse().map((m) => {
            const missed = m.total === 0 && !m.restored
            const restored = m.restored
            const active = m.total > 0 || restored
            const label = new Date(m.year, m.month, 1).toLocaleString('en-US', {
              month: 'long',
              year: 'numeric',
            })
            return (
              <div
                key={m.key}
                className={'str__row' + (missed ? ' is-missed' : '') + (restored ? ' is-restored' : '')}
              >
                <div className={'str__badge' + (active ? ' is-active' : '')}>
                  {active ? <Check size={14} strokeWidth={3} /> : <Lock size={12} />}
                </div>
                <div className="str__row-text">
                  <p className="str__row-label">{label}</p>
                  <p className="str__row-sub">
                    {restored
                      ? 'Restored'
                      : active
                        ? `${formatCurrency(m.total, currency)} saved`
                        : 'No savings recorded'}
                  </p>
                </div>
                {missed && streak.tokens > 0 && (
                  <button
                    type="button"
                    className="str__restore-btn"
                    onClick={() => openRestore(m)}
                  >
                    Restore
                  </button>
                )}
                {missed && streak.tokens === 0 && (
                  <span className="str__locked">No tokens</span>
                )}
              </div>
            )
          })}
        </section>
      )}

      <ConfirmDialog
        open={!!pendingRestore}
        onCancel={() => !busy && setPendingRestore(null)}
        onConfirm={confirmRestore}
        title="Restore this month?"
        message={
          pendingRestore && cost
            ? `Restoring ${cost.covers.length} month${cost.covers.length === 1 ? '' : 's'} costs ${formatCurrency(cost.cost, currency)} from your savings target, and uses 1 restore token.`
            : ''
        }
        confirmLabel={busy ? 'Restoring…' : 'Restore'}
      />
    </>
  )
}
