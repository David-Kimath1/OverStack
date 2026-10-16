import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { cumulativeSeries } from '../utils/savingsCalculations'
import { filterByRange } from '../utils/dateUtils'
import { formatCurrency } from '../utils/currency'
import { formatLongDate } from '../utils/dateUtils'
import './SavingsChart.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export default function SavingsChart({ savings, currency = 'KSh', range = 'ALL' }) {
  const points = useMemo(() => {
    const filtered = filterByRange(savings, range)
    return cumulativeSeries(filtered)
  }, [savings, range])

  const data = useMemo(() => ({
    labels: points.map((p) => formatLongDate(p.date)),
    datasets: [
      {
        data: points.map((p) => p.total),
        borderColor: '#2E87C8',
        backgroundColor: 'rgba(72, 169, 230, 0.15)',
        borderWidth: 2.5,
        // ---------- Dots ----------
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#2E87C8',
        pointBorderWidth: 2.5,
        pointHoverBackgroundColor: '#F47721',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 3,
        tension: 0.35,
        fill: true,
      },
    ],
  }), [points])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#17243A',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        padding: 10,
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
        ticks: {
          color: '#8491A5',
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(132, 145, 165, 0.12)' },
        ticks: {
          color: '#8491A5',
          font: { size: 10 },
          callback: (v) => {
            if (v >= 1000) return `${currency} ${(v / 1000).toFixed(0)}k`
            return `${currency} ${v}`
          },
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
    },
  }), [currency])

  if (points.length < 2) {
    return (
      <div className="chart__empty">
        <p>Not enough data yet</p>
        <p className="chart__empty-sub">
          Add a few savings to see your progress over time.
        </p>
      </div>
    )
  }

  return (
    <div className="chart">
      <Line data={data} options={options} />
    </div>
  )
}
