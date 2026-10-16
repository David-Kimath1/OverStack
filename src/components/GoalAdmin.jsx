import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './GoalAdmin.css'

export default function GoalAdmin({ onEdit, onDelete, compact = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (compact) {
    return (
      <div className="gadmin gadmin--compact" ref={ref}>
        <button
          type="button"
          className="gadmin__menu-btn"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          aria-label="Goal options"
        >
          <MoreHorizontal size={18} />
        </button>

        {open && (
          <div className="gadmin__menu" role="menu">
            <button
              type="button"
              className="gadmin__menu-item"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                onEdit?.()
              }}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              type="button"
              className="gadmin__menu-item gadmin__menu-item--danger"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                onDelete?.()
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="gadmin">
      <button
        type="button"
        className="gadmin__btn"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit?.()
        }}
      >
        <Pencil size={14} /> Edit
      </button>
      <button
        type="button"
        className="gadmin__btn gadmin__btn--danger"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete?.()
        }}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  )
}
