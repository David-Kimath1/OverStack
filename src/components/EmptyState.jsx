import './EmptyState.css'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty__icon">
          <Icon size={26} strokeWidth={1.8} />
        </div>
      )}
      <h3 className="empty__title">{title}</h3>
      {message && <p className="empty__msg">{message}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  )
}
