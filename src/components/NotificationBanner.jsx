import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import './NotificationBanner.css'

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState({ title: '', body: '' })

  useEffect(() => {
    function handleNotify(e) {
      setData(e.detail)
      setVisible(true)
      
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('overstack-notify', handleNotify)
    return () => window.removeEventListener('overstack-notify', handleNotify)
  }, [])

  return (
    <div className={`notif-banner ${visible ? 'is-visible' : ''}`}>
      <div className="notif-banner__icon">
        <img src="/icons/icon-192.png" alt="OverStack" />
      </div>
      <div className="notif-banner__content">
        <p className="notif-banner__title">{data.title}</p>
        <p className="notif-banner__body">{data.body}</p>
      </div>
      <button 
        className="notif-banner__close" 
        onClick={() => setVisible(false)}
      >
        <X size={16} />
      </button>
    </div>
  )
}
