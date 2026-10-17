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
  onEditSaving,
  monthLabel,
}) {
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeDraft, setIncomeDraft] = useState(income ? String(income) : '')
  const [savingIncome, setSavingIncome] = useState(false)

  const [editingSaved, setEditingSaved] = useState(false)
  const [savedDraft, setSavedDraft] = useState(savedThisMonth ? String(savedThisMonth) : '')
  const [savingQuick, setSavingQuick] = useState(false)

  const remaining = income - savedThisMonth
  const hasIncome = income > 0
  const overBudget = hasIncome && remaining < 0
  const savedPctOfIncome = hasIncome ? (savedThisMonth / income) * 100 : 0
  const targetPctOfIncome = hasIncome ? (monthlyTarget / income) * 100 : 0

  async function commitIncome() {
    const v = parseAmount(incomeDraft)
    if (!Number.isFinite(v) || v < 0) return
    setSavingIncome(true)
    try {
      await onSaveIncome?.(v)
      setEditingIncome(false)
    } finally {
      setSavingIncome(false)
    }
  }

  async function commitSaved() {
    const v = parseAmount(savedDraft)
    if (!Number.isFinite(v) || v < 0) return
    setSavingQuick(true)
    try {
      await onEditSaving?.(v)
      setEditingSaved(false)
    } finally {
      setSavingQuick(false)
    }
  }

  return (
    <section className="inc">
      <header className="inc__head">
        <p className="inc__eyebrow">
          <Wallet size={13} /> MONTHLY BUDGET
        </p>
        {!editingIncome && (
          <button type="button" className="inc__edit" onClick={() => setEditingIncome(true)} aria-label="Edit income">
            <Pencil size={12} />
            {hasIncome ? 'Edit income' : 'Set income'}
          </button>
        )}
      </header>

      {editingIncome ? (
        <div className="inc__editor">
          <label className="inc__label">MONTHLY INCOME ({currency})</label>
          <div className="inc__input-row">
            <span className="inc__prefix">{currency}</span>
            <input
              className="inc__input"
              inputMode="decimal"
              autoFocus
              placeholder="0"
              value={formatThousands(incomeDraft)}
              onChange={(e) => {
                const v = e.target.value.replace(/,/g, '')
                if (/^\d*\.?\d{0,2}$/.test(v)) setIncomeDraft(v)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitIncome()
                if (e.key === 'Escape') setEditingIncome(false)
              }}
            />
          </div>
          <div className="inc__actions">
            <button type="button" className="inc__btn inc__btn--ghost" onClick={() => setEditingIncome(false)} disabled={savingIncome}>
              <X size={14} /> Cancel
            </button>
            <button type="button" className="inc__btn inc__btn--primary" onClick={commitIncome} disabled={savingIncome}>
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
            
            {editingSaved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="inc__prefix" style={{ fontSize: '15px', color: 'var(--color-ocean-deep)' }}>−{currency}</span>
                <input
                  className="inc__quick-input"
                  style={{ width: '80px', textAlign: 'right', background: 'transparent', border: 'none', color: 'var(--color-ocean-deep)', fontSize: '15px', fontWeight: 'bold' }}
                  inputMode="decimal"
                  autoFocus
                  value={formatThousands(savedDraft)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/,/g, '')
                    if (/^\d*\.?\d{0,2}$/.test(v)) setSavedDraft(v)
                  }}
                  onBlur={commitSaved}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.target.blur()
                    if (e.key === 'Escape') { setEditingSaved(false); setSavedDraft(String(savedThisMonth)) }
                  }}
                />
              </div>
            ) : (
              <span 
                className="inc__row-value inc__row-value--minus" 
                onClick={() => { setEditingSaved(true); setSavedDraft(String(savedThisMonth)) }}
                style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(72, 169, 230, 0.5)', paddingBottom: '2px' }}
                title="Click to edit monthly total"
              >
                −{formatCurrency(savedThisMonth, currency)}
              </span>
            )}
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
