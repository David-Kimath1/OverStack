import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import BottomNavigation from './components/BottomNavigation'
import NotificationBanner from './components/NotificationBanner'
import NotificationPrompt from './components/NotificationPrompt'
import BiometricLock from './components/BiometricLock'
import { useTheme } from './hooks/useTheme'
import { useReminders } from './hooks/useReminders'
import { setSetting } from './storage/settingsStorage'
import Home from './pages/Home'
import Goals from './pages/Goals'
import GoalDetails from './pages/GoalDetails'
import AddSaving from './pages/AddSaving'
import History from './pages/History'
import Profile from './pages/Profile'
import Streak from './pages/Streak'
import Stats from './pages/Stats' // <--- IMPORTED STATS HERE

export default function App() {
  useTheme()
  useReminders()

  useEffect(() => {
    const isAppRunning = sessionStorage.getItem('overstack_session')
    if (!isAppRunning) {
      setSetting('balanceHidden', true)
      sessionStorage.setItem('overstack_session', 'true')
    }
  }, [])

  return (
    <HashRouter>
      <BiometricLock />
      <NotificationBanner />
      <NotificationPrompt />
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/goals"         element={<Goals />} />
            <Route path="/goals/:id"     element={<GoalDetails />} />
            <Route path="/add"           element={<AddSaving />} />
            <Route path="/history"       element={<History />} />
            <Route path="/profile"       element={<Profile />} />
            <Route path="/streak"        element={<Streak />} />
            <Route path="/stats"         element={<Stats />} /> {/* <--- ROUTE ADDED HERE */}
          </Routes>
        </main>
        <BottomNavigation />
      </div>
    </HashRouter>
  )
}
