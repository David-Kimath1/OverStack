import { useEffect, useMemo, useState } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import { useSavings } from '../hooks/useSavings'
import { useGoals } from '../hooks/useGoals'
import { getSetting } from '../storage/settingsStorage'
import { formatCurrency } from '../utils/currency'
import { sumForMonth } from '../utils/savingsCalculations'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import './Stats.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend)

export default function Stats() {
  const { savings, loading: savingsLoading } = useSavings()
  const { goals, loading: goalsLoading } = useGoals()
  const [view, setView] = useState('monthly')
  const [currency, setCurrency] = useState('KSh')

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    getSetting('currency').then((c) => setCurrency(c || 'KSh'))
  }, [])

  const insuranceGoal = goals.find(g => g.name.toLowerCase().includes('insurance'))
  const monthlySavingsGoal = goals.find(g => g.name === 'Monthly Savings' || g.name === 'General Savings')

  // Filter ONLY the Monthly Savings for the chart to match the Home screen
  const monthlyBudgetSavings = useMemo(() => {
    return savings.filter(s => s.goalId === monthlySavingsGoal?.id)
  }, [savings, monthlySavingsGoal])

  const monthlyData = useMemo(() => {
    const labels = []
    const data = []
    for (let i = 0; i < 12; i++) {
      labels.push(new Date(currentYear, i, 1).toLocaleString('en-US', { month: 'short' }))
      data.push(sumForMonth(monthlyBudgetSavings, currentYear, i))
    }
    return { labels, data }
  }, [monthlyBudgetSavings, currentYear])

  const yearlyData = useMemo(() => {
    const yearsMap = new Map()
    monthlyBudgetSavings.forEach(s => {
      const y = new Date(s.date).getFullYear()
      yearsMap.set(y, (yearsMap.get(y) || 0) + Number(s.amount))
    })
    const sortedYears = Array.from(yearsMap.keys()).sort()
    const labels = sortedYears.map(y => y.toString())
    const data = sortedYears.map(y => yearsMap.get(y))
    return { labels, data }
  }, [monthlyBudgetSavings])

  const chartData = view === 'monthly' ? monthlyData : yearlyData

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        borderColor: '#2E87C8',
        backgroundColor: 'rgba(72, 169, 230, 0.15)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#2E87C8',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#17243A',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.y, currency),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8491A5' },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(132, 145, 165, 0.1)' },
        ticks: {
          color: '#8491A5',
          callback: (v) => {
            if (v >= 1000) return `${currency} ${(v / 1000).toFixed(0)}k`
            return `${currency} ${v}`
          },
        },
        border: { display: false },
      },
    },
  }

  return (
    <>
      <AppHeader title="Statistics" subtitle="Your monthly budget savings over time" />

      <div className="stats__tabs">
        <button
          className={'stats__tab' + (view === 'monthly' ? ' is-active' : '')}
          onClick={() => setView('monthly')}
        >
          <Calendar size={16} /> Monthly
        </button>
        <button
          className={'stats__tab' + (view === 'yearly' ? ' is-active' : '')}
          onClick={() => setView('yearly')}
        >
          <TrendingUp size={16} /> Yearly
        </button>
      </div>

      <div className="stats__card">
        <h2 className="stats__title">
          {view === 'monthly' ? `${currentYear} Monthly Totals` : 'Total Savings by Year'}
        </h2>
        <div className="stats__chart-wrap">
          {savingsLoading || goalsLoading ? (
            <p className="stats__loading">Loading data...</p>
          ) : (
            <Line data={data} options={options} />
          )}
        </div>
      </div>
    </>
  )
}
