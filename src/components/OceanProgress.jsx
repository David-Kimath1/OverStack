import { useEffect, useRef, useState } from 'react'
import './OceanProgress.css'

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(target)
      fromRef.current = target
      return
    }
    const from = fromRef.current
    const delta = target - from
    const start = performance.now()
    cancelAnimationFrame(rafRef.current)
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + delta * eased
      fromRef.current = current
      setValue(current)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else {
        fromRef.current = target
        setValue(target)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

export default function OceanProgress({
  value = 0,
  size = 'md',
  completed = false,
  showPercent = true,
  labelLeft,
  labelRight,
  className = '',
}) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0))
  const displayed = useCountUp(clamped)

  const rootClass = [
    'op',
    `op--${size}`,
    completed && 'op--completed',
    displayed <= 0.5 && 'op--empty',
    displayed >= 99.5 && 'op--full',
    className,
  ].filter(Boolean).join(' ')

  const hasLabels = labelLeft || labelRight

  return (
    <div className={rootClass}>
      <div className="op__row">
        <div
          className="op__track"
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="op__fill" style={{ width: `${displayed}%` }}>
            <span className="op__glow" aria-hidden="true" />
          </div>
          <span
            className="op__tip"
            style={{ left: `${displayed}%` }}
            aria-hidden="true"
          />
        </div>

        {showPercent && (
          <span className="op__pct">{Math.round(displayed)}%</span>
        )}
      </div>

      {hasLabels && (
        <div className="op__labels">
          <span className="op__label">{labelLeft}</span>
          <span className="op__label">{labelRight}</span>
        </div>
      )}
    </div>
  )
}
