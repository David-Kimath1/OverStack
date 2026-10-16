import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { formatLongDate } from '../utils/dateUtils'
import OceanProgress from './OceanProgress'
import GoalAdmin from './GoalAdmin'
import './GoalCard.css'

export default function GoalCard({
  goal,
  stats,
  currency = 'KSh',
  onEdit,
  onDelete,
}) {
  const { saved, target, percent, remaining, completed } = stats
  const showAdmin = !!(onEdit || onDelete)

  return (
    <div className="gcard">
      {showAdmin && (
        <GoalAdmin
          compact
          onEdit={() => onEdit?.(goal)}
          onDelete={() => onDelete?.(goal)}
        />
      )}

      <Link to={`/goals/${goal.id}`} className="gcard__link">
        <div className="gcard__head">
          <h3 className="gcard__name">{goal.name}</h3>
          {completed ? (
            <span className="gcard__badge gcard__badge--done">Done</span>
          ) : (
            <span className="gcard__pct">{Math.round(percent)}%</span>
          )}
        </div>

        {goal.targetDate && (
          <p className="gcard__date">Target · {formatLongDate(goal.targetDate)}</p>
        )}

        <div className="gcard__bar">
          <OceanProgress
            value={percent}
            size="md"
            completed={completed}
            showPercent={false}
          />
        </div>

        <div className="gcard__row">
          <span className="gcard__saved">{formatCurrency(saved, currency)}</span>
          <span className="gcard__target">of {formatCurrency(target, currency)}</span>
        </div>

        {!completed && (
          <p className="gcard__remain">
            {formatCurrency(remaining, currency)} remaining
          </p>
        )}
      </Link>
    </div>
  )
}
