import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Plus, Target } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { getSetting } from '../storage/settingsStorage'
import { formatCurrency, parseAmount } from '../utils/currency'
import { todayISO } from '../utils/dateUtils'
import './AddSaving.css'

function formatThousands(raw) {
  if (!raw) return ''
  const [int, dec] = String(raw).replace(/,/g, '').split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas
}

export default function AddSaving() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetGoalId = searchParams.get('goalId')

  const { goals, addGoal, loading: goalsLoading } = useGoals()
  const { addSaving } = useSavings()

  const [currency, setCurrency] = useState('KSh')
  const [goalId, setGoalId] = useState(presetGoalId || '')
  const [amountRaw, setAmountRaw] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const [newGoalOpen, setNewGoalOpen] = useState(false)
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('')
  const [newGoalError, setNewGoalError] = useState(null)

  const amountRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const c = await getSetting('currency')
      setCurrency(c || 'KSh')
    })()
  }, [])

  useEffect(() => {
    if (!goalId && goals.length > 0) setGoalId(goals[0].id)
  }, [goals, goalId])

  useEffect(() => {
    amountRef.current?.focus()
  }, [])

  const parsedAmount = useMemo(() => parseAmount(amountRaw), [amountRaw])
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const canSubmit = goalId && amountValid && !submitting

  async function handleSubmit(e) {
    e?.preventDefault?.()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await addSaving({ goalId, amount: parsedAmount, date, note })
      const goal = goals.find((g) => g.id === goalId)
      setSuccess({
        amount: parsedAmount,
        goalName: goal?.name || 'goal',
      })
      setAmountRaw('')
      setNote('')
      setDate(todayISO())
      amountRef.current?.focus()
      setTimeout(() => setSuccess(null), 2600)
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateGoal(e) {
    e?.preventDefault?.()
    setNewGoalError(null)
    const target = parseAmount(newGoalTarget)
    if (!newGoalName.trim()) return setNewGoalError('Please enter a goal name.')
    if (!Number.isFinite(target) || target <= 0) {
      return setNewGoalError('Target must be a positive number.')
    }
    try {
      const g = await addGoal({
        name: newGoalName.trim(),
        targetAmount: target,
        targetDate: newGoalTargetDate || null,
      })
      setGoalId(g.id)
      setNewGoalName('')
      setNewGoalTarget('')
      setNewGoalTargetDate('')
      setNewGoalOpen(false)
    } catch (err) {
      setNewGoalError(err.message || 'Could not create goal.')
    }
  }

  function handleAmountChange(e) {
    const v = e.target.value.replace(/,/g, '')
    if (/^\d*\.?\d{0,2}$/.test(v)) setAmountRaw(v)
  }

  return (
    <>
      <AppHeader title="Add Saving" subtitle="Record a contribution" />

      <form className="addsave" onSubmit={handleSubmit}>
        {/* ---------- Amount (hero) ---------- */}
        <div className="addsave__amount">
          <label htmlFor="amount" className="addsave__label">AMOUNT</label>
          <div className="addsave__amount-row">
            <span className="addsave__currency">{currency}</span>
            <input
              id="amount"
              ref={amountRef}
              className="addsave__amount-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={formatThousands(amountRaw)}
              onChange={handleAmountChange}
              aria-label="Amount"
            />
          </div>
          {amountRaw && !amountValid && (
            <p className="addsave__hint addsave__hint--err">Enter a positive amount</p>
          )}
          {amountValid && (
            <p className="addsave__hint">{formatCurrency(parsedAmount, currency)}</p>
          )}
        </div>

        {/* ---------- Goal picker ---------- */}
        <div className="addsave__field">
          <label className="addsave__label">GOAL</label>
          {goalsLoading ? (
            <p className="addsave__loading">Loading goals…</p>
          ) : goals.length === 0 ? (
            <div className="addsave__empty">
              <Target size={20} />
              <p>You have no goals yet.</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setNewGoalOpen(true)}
              >
                <Plus size={16} /> Create a goal
              </button>
            </div>
          ) : (
            <>
              <div className="addsave__goals">
                {goals.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    className={'addsave__goal' + (g.id === goalId ? ' is-active' : '')}
                    onClick={() => setGoalId(g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="addsave__newgoal"
                onClick={() => setNewGoalOpen(true)}
              >
                <Plus size={14} /> New goal
              </button>
            </>
          )}
        </div>

        {/* ---------- Date ---------- */}
        <div className="addsave__field">
          <label className="addsave__label">DATE</label>
          <DatePicker
            value={date}
            onChange={setDate}
            max={todayISO()}
          />
        </div>

        {/* ---------- Note ---------- */}
        <div className="addsave__field">
          <label htmlFor="note" className="addsave__label">
            NOTE <span className="addsave__optional">(optional)</span>
          </label>
          <input
            id="note"
            type="text"
            className="addsave__input"
            placeholder="e.g. Monthly contribution"
            value={note}
            maxLength={80}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="addsave__error">{error}</p>}

        {/* ---------- Actions ---------- */}
        <div className="addsave__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary addsave__submit"
            disabled={!canSubmit}
          >
            {submitting
              ? 'Saving…'
              : !amountValid
                ? 'Enter an amount'
                : !goalId
                  ? 'Pick a goal'
                  : 'Add Saving'}
          </button>
        </div>
      </form>

      {/* ---------- Success toast ---------- */}
      {success && (
        <div className="addsave__toast" role="status">
          <div className="addsave__toast-icon">
            <Check size={18} strokeWidth={3} />
          </div>
          <div>
            <p className="addsave__toast-title">
              {formatCurrency(success.amount, currency)} saved
            </p>
            <p className="addsave__toast-sub">to {success.goalName}</p>
          </div>
        </div>
      )}

      {/* ---------- New goal modal ---------- */}
      <Modal
        open={newGoalOpen}
        onClose={() => { setNewGoalOpen(false); setNewGoalError(null) }}
        title="New goal"
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setNewGoalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleCreateGoal}
            >
              Create goal
            </button>
          </>
        }
      >
        <div className="addsave__modal">
          <label className="addsave__label">NAME</label>
          <input
            className="addsave__input"
            placeholder="e.g. New Bike"
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            autoFocus
          />

          <label className="addsave__label" style={{ marginTop: 12 }}>
            TARGET AMOUNT
          </label>
          <input
            className="addsave__input"
            inputMode="decimal"
            placeholder="0"
            value={formatThousands(newGoalTarget)}
            onChange={(e) => {
              const v = e.target.value.replace(/,/g, '')
              if (/^\d*\.?\d{0,2}$/.test(v)) setNewGoalTarget(v)
            }}
          />

          <label className="addsave__label" style={{ marginTop: 12 }}>
            TARGET DATE <span className="addsave__optional">(optional)</span>
          </label>
          <DatePicker
            value={newGoalTargetDate}
            onChange={setNewGoalTargetDate}
            placeholder="No target date"
          />

          {newGoalError && (
            <p className="addsave__error" style={{ marginTop: 10 }}>
              {newGoalError}
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
