export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.')
  }
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function sendTestNotification() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied.')
  }

  // Wait for the service worker to be ready
  const registration = await navigator.serviceWorker.ready
  
  registration.showNotification('OverStack Reminder', {
    body: 'Time to check your savings goals!',
    icon: '/icons/icon-192.png',     // The big icon
    badge: '/icons/badge.png',       // The tiny status bar icon
    vibrate: [200, 100, 200],
    tag: 'overstack-test',
    data: { url: '/' }
  })
}
