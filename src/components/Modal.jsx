import { useEffect } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card">
        <header className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}
