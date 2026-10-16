import { useEffect, useMemo, useState } from 'react'
import { Search, Filter, Pencil, Trash2, History as HistoryIcon, X } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import DatePicker from '../components/DatePicker'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { getSetting } from '../storage/settingsStorage'
import { formatCurrency, parseAmount } from '../utils/currency'
import { formatDayMonth, formatLongDate, todayISO } from '../utils/dateUtils'
import './History.css'

function formatThousands(raw) {
  if (!raw) return ''
  const [int, dec] = String(raw).replace(/,/g, '').split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas
}

export default function History() {
  const { goals } = useGoals()
  const { savings, loading, editSaving, removeSaving } = useSavings()
  const [currency, setCurrency] = useState('KSh')

  const [query, setQuery] = useState('')
  const [filterGoalId, setFilterGoalId] = useState('all')
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editError, setEditError] = useState(null)

  useEffect(() => {
    getSetting('currency').then((c) => setCurrency(c || 'KSh'))
  }, [])

  const goalMap = useMemo(() => {
    const m = new Map()
    for (const g of goals) m.set(g.id, g)
    return m
  }, [goals])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return savings.filter((s) => {
      if (filterGoalId !== 'all' && s.goalId !== filterGoalId) return false
      if (!q) return true
      const goalName = goalMap.get(s.goalId)?.name?.toLowerCase() || ''
      const note = (s.note || '').toLowerCase()
      return goalName.includes(q) || note.includes(q)
    })
  }, [savings, query, filterGoalId, goalMap])

  const grouped = useMemo(() => {
    const buckets = new Map()
    for (const s of filtered) {
      if (!buckets.has(s.date)) buckets.set(s.date, [])
      buckets.get(s.date).push(s)
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => b.createdAt - a.createdAt),
        total: items.reduce((sum, x) => sum + Number(x.amount || 0), 0),
      }))
  }, [filtered])

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, s) => sum + Number(s.amount || 0), 0),
    [filtered]
  )

  function openEdit(s) {
    setEditing(s)
    setEditAmount(String(s.amount))
    setEditDate(s.date)
    setEditNote(s.note || '')
    setEditError(null)
  }

  async function handleEditSave() {
    setEditError(null)
    const amt = parseAmount(editAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return setEditError('Amount must be greater than zero.')
    }
    try {
      await editSaving(editing.id, {
        amount: amt,
        date: editDate,
        note: editNote.trim(),
      })
      setEditing(null)
    } catch (e) {
      setEditError(e.message || 'Could not save.')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await removeSaving(pendingDelete.id)
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const isFiltering = query.trim() || filterGoalId !== 'all'

  return (
    <>
      <AppHeader
        title="History"
        subtitle={
          savings.length
            ? `${savings.length} contribution${savings.length === 1 ? '' : 's'}`
            : 'No contributions yet'
        }
      />

      {/* ---------- Controls ---------- */}
      {savings.length > 0 && (
        <div className="hist__controls">
          <div className="hist__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search note or goal…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="hist__search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="hist__filter">
            <Filter size={14} />
            <select
              value={filterGoalId}
              onChange={(e) => setFilterGoalId(e.target.value)}
            >
              <option value="all">All goals</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isFiltering && filtered.length > 0 && (
        <p className="hist__summary">
          Showing {filtered.length} · {formatCurrency(filteredTotal, currency)}
        </p>
      )}

      {/* ---------- List ---------- */}
      {loading ? (
        <p className="hist__loading">Loading…</p>
      ) : savings.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No contributions yet"
          message="Savings you record will appear here, grouped by date."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          message="Try a different search term or clear the filter."
        />
      ) : (
        <div className="hist__list">
          {grouped.map((group) => (
            <div key={group.date} className="hist__group">
              <div className="hist__group-head">
                <span className="hist__group-date">{formatDayMonth(group.date)}</span>
                <span className="hist__group-total">
                  +{formatCurrency(group.total, currency)}
                </span>
              </div>

              {group.items.map((s) => {
                const goal = goalMap.get(s.goalId)
                return (
                  <div key={s.id} className="hist__row">
                    <div className="hist__row-main">
                      <p className="hist__row-goal">
                        {goal?.name || 'Deleted goal'}
                      </p>
                      {s.note && <p className="hist__row-note">{s.note}</p>}
                    </div>

                    <span className="hist__row-amount">
                      +{formatCurrency(s.amount, currency)}
                    </span>

                    <div className="hist__row-actions">
                      <button
                        type="button"
                        className="hist__icon-btn"
                        onClick={() => openEdit(s)}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="hist__icon-btn hist__icon-btn--danger"
                        onClick={() => setPendingDelete(s)}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* ---------- Edit modal ---------- */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit contribution"
        footer={
          <>
            <button
              className="btn btn--ghost"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleEditSave}>
              Save changes
            </button>
          </>
        }
      >
        <div className="hist__edit">
          <label className="hist__edit-label">AMOUNT</label>
          <input
            className="hist__edit-input"
            inputMode="decimal"
            value={formatThousands(editAmount)}
            onChange={(e) => {
              const v = e.target.value.replace(/,/g, '')
              if (/^\d*\.?\d{0,2}$/.test(v)) setEditAmount(v)
            }}
          />

          <label className="hist__edit-label" style={{ marginTop: 12 }}>
            DATE
          </label>
          <DatePicker
            value={editDate}
            onChange={setEditDate}
            max={todayISO()}
          />

          <label className="hist__edit-label" style={{ marginTop: 12 }}>
            NOTE <span className="hist__edit-opt">(optional)</span>
          </label>
          <input
            className="hist__edit-input"
            value={editNote}
            maxLength={80}
            onChange={(e) => setEditNote(e.target.value)}
          />

          {editError && <p className="hist__edit-error">{editError}</p>}
        </div>
      </Modal>

      {/* ---------- Delete confirm ---------- */}
      <ConfirmDialog
        open={!!pendingDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this contribution?"
        message={
          pendingDelete
            ? `${formatCurrency(pendingDelete.amount, currency)} recorded on ${formatLongDate(pendingDelete.date)} will be permanently removed.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
      />
    </>
  )
}
