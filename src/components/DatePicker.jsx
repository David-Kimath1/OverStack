import { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from './Modal'
import { toISODate, parseISODate, formatLongDate, todayISO } from '../utils/dateUtils'
import './DatePicker.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['S','M','T','W','T','F','S']

export default function DatePicker({ value, onChange, max, min, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false)
  const initial = value ? parseISODate(value) : new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  const maxDate = max ? parseISODate(max) : null
  const minDate = min ? parseISODate(min) : null

  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startDay = first.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [viewYear, viewMonth])

  function prevMonth() {
    const m = viewMonth - 1
    if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(m)
  }
  function nextMonth() {
    const m = viewMonth + 1
    if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(m)
  }

  function isDisabled(day) {
    if (!day) return true
    const d = new Date(viewYear, viewMonth, day)
    if (maxDate && d > maxDate) return true
    if (minDate && d < minDate) return true
    return false
  }

  function pick(day) {
    if (isDisabled(day)) return
    const iso = toISODate(new Date(viewYear, viewMonth, day))
    onChange(iso)
    setOpen(false)
  }

  const todayIso = todayISO()
  const selectedIso = value

  return (
    <>
      <button
        type="button"
        className="dp__trigger"
        onClick={() => setOpen(true)}
      >
        <CalendarIcon size={16} />
        <span className={value ? '' : 'dp__trigger-placeholder'}>
          {value ? formatLongDate(value) : placeholder}
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pick a date">
        <div className="dp">
          <div className="dp__head">
            <button type="button" className="dp__nav" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <div className="dp__title">
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button type="button" className="dp__nav" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="dp__dow">
            {DOW.map((d, i) => <span key={i}>{d}</span>)}
          </div>

          <div className="dp__grid">
            {grid.map((day, i) => {
              if (!day) return <span key={i} />
              const iso = toISODate(new Date(viewYear, viewMonth, day))
              const disabled = isDisabled(day)
              const isSelected = iso === selectedIso
              const isToday = iso === todayIso
              return (
                <button
                  key={i}
                  type="button"
                  className={
                    'dp__cell' +
                    (isSelected ? ' is-selected' : '') +
                    (isToday && !isSelected ? ' is-today' : '') +
                    (disabled ? ' is-disabled' : '')
                  }
                  onClick={() => pick(day)}
                  disabled={disabled}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="dp__foot">
            <button
              type="button"
              className="dp__quick"
              onClick={() => { onChange(todayIso); setOpen(false) }}
              disabled={isDisabled(new Date().getDate()) && viewMonth === new Date().getMonth() && viewYear === new Date().getFullYear()}
            >
              Today
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
