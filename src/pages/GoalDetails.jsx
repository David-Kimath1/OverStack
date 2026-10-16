import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2, Pencil as EditIcon, Trash2 as TrashIcon,
} from 'lucide-react'
import AppHeader from '../components/AppHeader'
import OceanProgress from '../components/OceanProgress'
import SavingsChart from '../components/SavingsChart'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalFormModal from '../components/GoalFormModal'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { getSetting } from '../storage/settingsStorage'
import { goalStats, sumForGoal } from '../utils/savingsCalculations'
import { formatCurrency, parseAmount } from '../utils/currency'
import { formatDayMonth, formatLongDate, todayISO } from '../utils/dateUtils'
import './GoalDetails.css'

const RANGES = ['1M', '3M', '6M', '1Y', 'ALL']

function formatThousands(raw) {
  if (!raw) return ''
  const [int, dec] = String(raw).replace(/,/g, '').split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas
}

export default function GoalDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { goals, editGoal, removeGoal } = useGoals()
  const { savings, loading, addSaving, editSaving, removeSaving } = useSavings()

  const [currency, setCurrency] = useState('KSh')
  const [range, setRange] = useState('ALL')

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [addDate, setAddDate] = useState(todayISO())
  const [addNote, setAddNote] = useState('')
  const [addError, setAddError] = useState(null)

  const [editingSaving, setEditingSaving] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editError, setEditError] = useState(null)

  const [pendingSavingDelete, setPendingSavingDelete] = useState(null)

  useEffect(() => {
    getSetting('currency').then((c) => setCurrency(c || 'KSh'))
  }, [])

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id])

  const goalSavings = useMemo(
    () => savings.filter((s) => s.goalId === id),
    [savings, id]
  )

  const stats = useMemo(
    () => (goal ? goalStats(goal, savings) : null),
    [goal, savings]
  )

  const sortedForList = useMemo(
    () => [...goalSavings].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return b.createdAt - a.createdAt
    }),
    [goalSavings]
  )

  if (!goal && !loading) {
    return (
      <>
        <AppHeader title="Goal not found" />
        <p className="gd__notfound">
          This goal no longer exists.{' '}
          <Link to="/goals">Back to goals</Link>
        </p>
      </>
    )
  }

  if (!goal || !stats) {
    return (
      <>
        <AppHeader title="Loading…" />
      </>
    )
  }

  async function handleDelete() {
    await removeGoal(goal.id)
    navigate('/goals')
  }

  async function handleAddSaving() {
    setAddError(null)
    const amt = parseAmount(addAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return setAddError('Amount must be greater than zero.')
    }
    await addSaving({ goalId: goal.id, amount: amt, date: addDate, note: addNote })
    setAddAmount('')
    setAddNote('')
    setAddDate(todayISO())
    setAddOpen(false)
  }

  function openEditSaving(s) {
    setEditingSaving(s)
    setEditAmount(String(s.amount))
    setEditDate(s.date)
    setEditNote(s.note || '')
    setEditError(null)
  }

  async function handleEditSaving() {
    setEditError(null)
    const amt = parseAmount(editAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return setEditError('Amount must be greater than zero.')
    }
    await editSaving(editingSaving.id, { amount: amt, date: editDate, note: editNote })
    setEditingSaving(null)
  }

  async function confirmSavingDelete() {
    await removeSaving(pendingSavingDelete.id)
    setPendingSavingDelete(null)
  }

  return (
    <>
      <AppHeader
        title={goal.name}
        subtitle={goal.description || undefined}
        right={
          <div className="gd__header-actions">
            <button
              className="gd__icon-btn"
              onClick={() => setEditOpen(true)}
              aria-label="Edit goal"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              className="gd__icon-btn gd__icon-btn--danger"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete goal"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      />

      <Link to="/goals" className="gd__back">
        <ArrowLeft size={14} /> All goals
      </Link>

      {/* ---------- Big progress ---------- */}
      <section className="gd__hero">
        <div className="gd__hero-head">
          <div>
            <p className="gd__hero-saved">
              {formatCurrency(stats.saved, currency)}
            </p>
            <p className="gd__hero-of">
              of {formatCurrency(stats.target, currency)}
            </p>
          </div>
          <span className={'gd__hero-pct' + (stats.completed ? ' is-done' : '')}>
            {Math.round(stats.percent)}%
          </span>
        </div>

        <div className="gd__hero-bar">
          <OceanProgress
            value={stats.percent}
            size="lg"
            completed={stats.completed}
            showPercent={false}
          />
        </div>

        <div className="gd__hero-foot">
          <span>
            {stats.completed
              ? `Target reached · ${formatCurrency(stats.overflow, currency)} over`
              : `${formatCurrency(stats.remaining, currency)} remaining`}
          </span>
          {goal.targetDate && (
            <span className="gd__hero-date">
              Target · {formatLongDate(goal.targetDate)}
            </span>
          )}
        </div>

        <button
          className="btn btn--primary gd__add-btn"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={16} /> Add saving
        </button>
      </section>

      {/* ---------- Chart ---------- */}
      <section className="gd__section">
        <div className="gd__section-head">
          <p className="gd__eyebrow">PROGRESS OVER TIME</p>
          <div className="gd__ranges">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={'gd__range' + (range === r ? ' is-active' : '')}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="gd__chart-card">
          <SavingsChart
            savings={goalSavings}
            currency={currency}
            range={range}
          />
        </div>
      </section>

      {/* ---------- Contributions ---------- */}
      <section className="gd__section">
        <div className="gd__section-head">
          <p className="gd__eyebrow">CONTRIBUTIONS ({goalSavings.length})</p>
        </div>

        {goalSavings.length === 0 ? (
          <p className="gd__empty">
            No contributions yet. Add the first one above.
          </p>
        ) : (
          <div className="gd__contrib-list">
            {sortedForList.map((s) => (
              <div key={s.id} className="gd__contrib-row">
                <div className="gd__contrib-main">
                  <p className="gd__contrib-date">{formatDayMonth(s.date)}</p>
                  {s.note && <p className="gd__contrib-note">{s.note}</p>}
                </div>
                <span className="gd__contrib-amount">
                  +{formatCurrency(s.amount, currency)}
                </span>
                <div className="gd__contrib-actions">
                  <button
                    type="button"
                    className="gd__icon-btn gd__icon-btn--sm"
                    onClick={() => openEditSaving(s)}
                    aria-label="Edit"
                  >
                    <EditIcon size={13} />
                  </button>
                  <button
                    type="button"
                    className="gd__icon-btn gd__icon-btn--sm gd__icon-btn--danger"
                    onClick={() => setPendingSavingDelete(s)}
                    aria-label="Delete"
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Add saving modal ---------- */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add saving"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleAddSaving}>
              Add saving
            </button>
          </>
        }
      >
        <div className="gd__form">
          <label className="gd__label">AMOUNT</label>
          <div className="gd__amount-row">
            <span className="gd__currency">{currency}</span>
            <input
              className="gd__amount-input"
              inputMode="decimal"
              placeholder="0"
              value={formatThousands(addAmount)}
              onChange={(e) => {
                const v = e.target.value.replace(/,/g, '')
                if (/^\d*\.?\d{0,2}$/.test(v)) setAddAmount(v)
              }}
              autoFocus
            />
          </div>

          <label className="gd__label" style={{ marginTop: 12 }}>DATE</label>
          <DatePicker value={addDate} onChange={setAddDate} max={todayISO()} />

          <label className="gd__label" style={{ marginTop: 12 }}>
            NOTE <span className="gd__opt">(optional)</span>
          </label>
          <input
            className="gd__input"
            value={addNote}
            maxLength={80}
            onChange={(e) => setAddNote(e.target.value)}
          />

          {addError && <p className="gd__error">{addError}</p>}
        </div>
      </Modal>

      {/* ---------- Edit goal ---------- */}
      <GoalFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={(data) => editGoal(goal.id, data)}
        initial={goal}
      />

      {/* ---------- Delete goal ---------- */}
      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this goal?"
        message={`"${goal.name}" and all its savings records will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete goal"
        destructive
      />

      {/* ---------- Edit saving ---------- */}
      <Modal
        open={!!editingSaving}
        onClose={() => setEditingSaving(null)}
        title="Edit contribution"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setEditingSaving(null)}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleEditSaving}>
              Save
            </button>
          </>
        }
      >
        <div className="gd__form">
          <label className="gd__label">AMOUNT</label>
          <input
            className="gd__input"
            inputMode="decimal"
            value={formatThousands(editAmount)}
            onChange={(e) => {
              const v = e.target.value.replace(/,/g, '')
              if (/^\d*\.?\d{0,2}$/.test(v)) setEditAmount(v)
            }}
          />
          <label className="gd__label" style={{ marginTop: 12 }}>DATE</label>
          <DatePicker value={editDate} onChange={setEditDate} max={todayISO()} />
          <label className="gd__label" style={{ marginTop: 12 }}>NOTE</label>
          <input
            className="gd__input"
            value={editNote}
            maxLength={80}
            onChange={(e) => setEditNote(e.target.value)}
          />
          {editError && <p className="gd__error">{editError}</p>}
        </div>
      </Modal>

      {/* ---------- Delete saving ---------- */}
      <ConfirmDialog
        open={!!pendingSavingDelete}
        onCancel={() => setPendingSavingDelete(null)}
        onConfirm={confirmSavingDelete}
        title="Delete this contribution?"
        message={
          pendingSavingDelete
            ? `${formatCurrency(pendingSavingDelete.amount, currency)} on ${formatLongDate(pendingSavingDelete.date)} will be removed.`
            : ''
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  )
}
