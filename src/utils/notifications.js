export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.')
  }
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function sendTestNotification(title = 'OverStack Reminder', body = 'Time to check your savings goals!') {
  if (!('serviceWorker' in navigator)) return
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  
  registration.showNotification(title, {
    body: body,
    icon: '/icons/notification-192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    tag: 'overstack-reminder',
    data: { url: '/' }
  })

  window.dispatchEvent(new CustomEvent('overstack-notify', {
    detail: { title, body }
  }))
}
