import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { requestNotificationPermission } from '../utils/notifications'
import './NotificationPrompt.css'

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if supported and currently 'default' (not granted/denied)
    if (!('Notification' in window)) return
    
    if (Notification.permission === 'default') {
      // Show after 5 seconds of using the app
      const timer = setTimeout(() => {
        // Check again in case they granted it in another tab
        if (Notification.permission === 'default') {
          setVisible(true)
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  async function handleEnable() {
    const granted = await requestNotificationPermission()
    if (granted) setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="notif-prompt">
      <div className="notif-prompt__content">
        <div className="notif-prompt__icon"><Bell size={20} /></div>
        <div>
          <p className="notif-prompt__title">Enable Reminders</p>
          <p className="notif-prompt__sub">Get notified to check your goals.</p>
        </div>
      </div>
      <div className="notif-prompt__actions">
        <button className="btn btn--ghost notif-prompt__btn" onClick={() => setVisible(false)}>
          Not now
        </button>
        <button className="btn btn--primary notif-prompt__btn" onClick={handleEnable}>
          Enable
        </button>
      </div>
      <button className="notif-prompt__close" onClick={() => setVisible(false)}>
        <X size={16} />
      </button>
    </div>
  )
}
