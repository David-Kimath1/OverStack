import { HashRouter, Routes, Route } from 'react-router-dom'
import BottomNavigation from './components/BottomNavigation'
import NotificationBanner from './components/NotificationBanner'
import { useTheme } from './hooks/useTheme'
import Home from './pages/Home'
import Goals from './pages/Goals'
import GoalDetails from './pages/GoalDetails'
import AddSaving from './pages/AddSaving'
import History from './pages/History'
import Profile from './pages/Profile'
import Streak from './pages/Streak'

export default function App() {
  useTheme()

  return (
    <HashRouter>
      <NotificationBanner />
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
          </Routes>
        </main>
        <BottomNavigation />
      </div>
    </HashRouter>
  )
}
