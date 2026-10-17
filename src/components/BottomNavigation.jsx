import { NavLink } from 'react-router-dom'
import { Home, Target, Plus, BarChart3, User } from 'lucide-react'
import './BottomNavigation.css'

const LEFT = [
  { to: '/',        icon: Home,    label: 'Home',    end: true },
  { to: '/goals',   icon: Target,  label: 'Goals' },
]
const RIGHT = [
  { to: '/stats',   icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User,    label: 'Profile' },
]

function Item({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => 'nav__item' + (isActive ? ' is-active' : '')}
    >
      <Icon size={20} strokeWidth={2.1} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function BottomNavigation() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__side">
        {LEFT.map((i) => <Item key={i.to} {...i} />)}
      </div>

      <NavLink to="/add" className="nav__fab" aria-label="Add saving">
        <Plus size={24} strokeWidth={2.6} />
      </NavLink>

      <div className="nav__side">
        {RIGHT.map((i) => <Item key={i.to} {...i} />)}
      </div>
    </nav>
  )
}
