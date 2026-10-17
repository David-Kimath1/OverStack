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

  const registration = await navigator.serviceWorker.ready
  
  // 1. Trigger the System Notification
  registration.showNotification('OverStack Reminder', {
    body: 'Time to check your savings goals!',
    icon: '/icons/icon-192.png',     // Large color icon
    badge: '/icons/icon-192.png',    // Trying color for the badge slot too
    vibrate: [200, 100, 200],
    tag: 'overstack-test',
    data: { url: '/' }
  })

  // 2. Trigger the In-App Slide-Down Banner
  window.dispatchEvent(new CustomEvent('overstack-notify', {
    detail: {
      title: 'OverStack Reminder',
      body: 'Time to check your savings goals!'
    }
  }))
}
