import { useState } from 'react'
import { Wallet, Check, X, Pencil } from 'lucide-react'
import { formatCurrency, parseAmount, formatThousands } from '../utils/currency'
import './IncomeCard.css'

export default function IncomeCard({
  income = 0,
  savedThisMonth = 0,
  monthlyTarget = 20000,
  currency = 'KSh',
  onSaveIncome,
  monthLabel,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(income ? String(income) : '')
  const [saving, setSaving] = useState(false)

  const remaining = income - savedThisMonth
  const hasIncome = income > 0
  const overBudget = hasIncome && remaining < 0
  const savedPctOfIncome = hasIncome ? (savedThisMonth / income) * 100 : 0
  const targetPctOfIncome = hasIncome ? (monthlyTarget / income) * 100 : 0

  async function commit() {
    const v = parseAmount(draft)
    if (!Number.isFinite(v) || v < 0) return
    setSaving(true)
    try {
      await onSaveIncome?.(v)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setDraft(income ? String(income) : '')
    setEditing(false)
  }

  return (
    <section className="inc">
      <header className="inc__head">
        <p className="inc__eyebrow">
          <Wallet size={13} /> MONTHLY BUDGET
        </p>
        {!editing && (
          <button type="button" className="inc__edit" onClick={() => setEditing(true)} aria-label="Edit income">
            <Pencil size={12} />
            {hasIncome ? 'Edit income' : 'Set income'}
          </button>
        )}
      </header>

      {editing ? (
        <div className="inc__editor">
          <label className="inc__label">MONTHLY INCOME ({currency})</label>
          <div className="inc__input-row">
            <span className="inc__prefix">{currency}</span>
            <input
              className="inc__input"
              inputMode="decimal"
              autoFocus
              placeholder="0"
              value={formatThousands(draft)}
              onChange={(e) => {
                const v = e.target.value.replace(/,/g, '')
                if (/^\d*\.?\d{0,2}$/.test(v)) setDraft(v)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') cancel()
              }}
            />
          </div>
          <div className="inc__actions">
            <button type="button" className="inc__btn inc__btn--ghost" onClick={cancel} disabled={saving}>
              <X size={14} /> Cancel
            </button>
            <button type="button" className="inc__btn inc__btn--primary" onClick={commit} disabled={saving}>
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      ) : !hasIncome ? (
        <p className="inc__empty">Set your monthly income to see how much you can still save.</p>
      ) : (
        <>
          <div className="inc__row inc__row--top">
            <span className="inc__row-label">Income</span>
            <span className="inc__row-value">{formatCurrency(income, currency)}</span>
          </div>

          <div className="inc__row">
            <span className="inc__row-label">Saved {monthLabel ? `in ${monthLabel}` : ''}</span>
            <span className="inc__row-value inc__row-value--minus">
              −{formatCurrency(savedThisMonth, currency)}
            </span>
          </div>

          <div className={'inc__row inc__row--remaining' + (overBudget ? ' is-over' : '')}>
            <span className="inc__row-label">Remaining</span>
            <span className="inc__row-value">{formatCurrency(remaining, currency)}</span>
          </div>

          <div className="inc__bar" aria-hidden="true">
            {targetPctOfIncome > 0 && targetPctOfIncome <= 100 && (
              <span className="inc__bar-target" style={{ left: `${targetPctOfIncome}%` }} />
            )}
            <span
              className={'inc__bar-fill' + (overBudget ? ' is-over' : '')}
              style={{ width: `${Math.min(100, savedPctOfIncome)}%` }}
            />
          </div>

          <p className="inc__foot">
            {overBudget
              ? `Over budget by ${formatCurrency(Math.abs(remaining), currency)}`
              : `${Math.round(savedPctOfIncome)}% of income saved · ${formatCurrency(Math.max(0, remaining), currency)} still available`}
          </p>
        </>
      )}
    </section>
  )
}