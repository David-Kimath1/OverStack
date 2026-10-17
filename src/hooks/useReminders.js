import { useEffect } from 'react'
import { sendTestNotification } from '../utils/notifications'

export function useReminders() {
  useEffect(() => {
    function checkDateForReminders() {
      const today = new Date()
      const day = today.getDate()
      const month = today.getMonth() // 0-11
      const lastNotified = localStorage.getItem('overstack_last_reminder')
      const currentYear = today.getFullYear()
      const reminderKey = `${currentYear}-${month}-${day}`

      if (lastNotified === reminderKey) return // Already notified today

      // 1. End of Year Reminder (Dec 25th - 31st)
      if (month === 11 && day >= 25) {
        sendTestNotification(
          'Year Ending Soon!',
          'Only a few days left in the year. Check your yearly savings progress and prepare for the new year!'
        )
        localStorage.setItem('overstack_last_reminder', reminderKey)
      }

      // 2. 5 days before the 1st (25th, 26th, 27th)
      if (day >= 25 && day <= 27) {
        sendTestNotification(
          'New Month Approaching!',
          '5 days until the new month. Time to set your income and plan your savings!'
        )
        localStorage.setItem('overstack_last_reminder', reminderKey)
      }

      // 3. 5 days after the 1st (5th, 6th, 7th)
      if (day >= 5 && day <= 7) {
        sendTestNotification(
          'Have you saved yet?',
          'It is 5 days into the new month. Do not forget your insurance deduction!'
        )
        localStorage.setItem('overstack_last_reminder', reminderKey)
      }
    }

    checkDateForReminders()
    const interval = setInterval(checkDateForReminders, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [])
}
