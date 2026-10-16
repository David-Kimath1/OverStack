import Modal from './Modal'
import './ConfirmDialog.css'

export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={'btn ' + (destructive ? 'btn--danger' : 'btn--primary')}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p className="confirm__msg">{message}</p>}
    </Modal>
  )
}
