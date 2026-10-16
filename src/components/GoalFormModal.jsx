import { useEffect, useState } from 'react'
import Modal from './Modal'
import DatePicker from './DatePicker'
import './GoalFormModal.css'
import { parseAmount } from '../utils/currency'
import { todayISO } from '../utils/dateUtils'

function formatThousands(raw) {
  if (!raw) return ''
  const [int, dec] = String(raw).replace(/,/g, '').split('.')
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec !== undefined ? `${withCommas}.${dec}` : withCommas
}

export default function GoalFormModal({ open, onClose, onSubmit, initial }) {
  const isEdit = !!initial
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (initial) {
      setName(initial.name || '')
      setTarget(initial.targetAmount ? String(initial.targetAmount) : '')
      setTargetDate(initial.targetDate || '')
      setDescription(initial.description || '')
    } else {
      setName('')
      setTarget('')
      setTargetDate('')
      setDescription('')
    }
  }, [open, initial])

  async function handleSubmit() {
    setError(null)
    const t = parseAmount(target)
    if (!name.trim()) return setError('Please enter a goal name.')
    if (!Number.isFinite(t) || t <= 0) return setError('Target must be a positive number.')

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: t,
        targetDate: targetDate || null,
        description: description.trim(),
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save goal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit goal' : 'New goal'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create goal'}
          </button>
        </>
      }
    >
      <div className="goalform">
        <label className="goalform__label">NAME</label>
        <input
          className="goalform__input"
          placeholder="e.g. New Laptop"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
        />

        <label className="goalform__label" style={{ marginTop: 12 }}>
          TARGET AMOUNT
        </label>
        <input
          className="goalform__input"
          inputMode="decimal"
          placeholder="0"
          value={formatThousands(target)}
          onChange={(e) => {
            const v = e.target.value.replace(/,/g, '')
            if (/^\d*\.?\d{0,2}$/.test(v)) setTarget(v)
          }}
        />

        <label className="goalform__label" style={{ marginTop: 12 }}>
          TARGET DATE <span className="goalform__opt">(optional)</span>
        </label>
        <DatePicker
          value={targetDate}
          onChange={setTargetDate}
          min={isEdit ? undefined : todayISO()}
          placeholder="No target date"
        />

        {targetDate && (
          <button
            type="button"
            className="goalform__clear"
            onClick={() => setTargetDate('')}
          >
            Clear target date
          </button>
        )}

        <label className="goalform__label" style={{ marginTop: 12 }}>
          DESCRIPTION <span className="goalform__opt">(optional)</span>
        </label>
        <textarea
          className="goalform__input goalform__input--area"
          placeholder="What is this goal for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          rows={3}
        />

        {error && <p className="goalform__error">{error}</p>}
      </div>
    </Modal>
  )
}
