import { useState, useEffect } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { formatCurrency, currencySymbol } from '../utils/currency'
import { triggerSaveFeedback } from '../utils/feedback'
import './InsuranceCard.css'

export default function InsuranceCard({ 
  amount = 3008, 
  isPaid = false, 
  currency = 'KSh', 
  onConfirm,
  isHidden = false,
  privacyMode = 'dots',
  target = 320427,
  saved = 0
}) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [paid, setPaid] = useState(isPaid)

  useEffect(() => { setPaid(isPaid) }, [isPaid])

  async function handleConfirm() {
    if (paid) return
    triggerSaveFeedback()
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 1500)
    setPaid(true)
    await onConfirm()
  }

  let displayAmount = formatCurrency(amount, currency)
  let displaySaved = formatCurrency(saved, currency)
  let displayTarget = formatCurrency(target, currency)
  
  if (isHidden) {
    if (privacyMode === 'stars') {
      displayAmount = `${currencySymbol(currency)} ******`
      displaySaved = `${currencySymbol(currency)} ******`
      displayTarget = `${currencySymbol(currency)} ******`
    } else if (privacyMode === 'dots') {
      displayAmount = `${currencySymbol(currency)} ••••••`
      displaySaved = `${currencySymbol(currency)} ••••••`
      displayTarget = `${currencySymbol(currency)} ••••••`
    }
  }

  return (
    <section className={`ins-card ${paid ? 'is-paid' : 'is-pending'}`}>
      <div className="ins-card__head">
        <div className="ins-card__title">
          <ShieldCheck size={18} />
          Insurance Fund
        </div>
        <span className="ins-card__badge">10-Year Plan</span>
      </div>

      <div className="ins-card__body">
        <div>
          <p className="ins-card__label">Monthly Deduction</p>
          <div className="ins-card__amount-row">
            <span className={`ins-card__amount ${paid ? 'text-success' : 'text-danger'} ${isHidden && privacyMode === 'blur' ? 'is-blurred' : ''}`}>
              {isHidden && privacyMode !== 'blur' ? displayAmount : (
                <>{paid ? '+' : '-'}{displayAmount}</>
              )}
            </span>
            
            {!paid && (
              <button className="ins-card__check-btn" onClick={handleConfirm} aria-label="Mark as saved">
                <Check size={18} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="ins-card__progress">
          <div className="ins-card__progress-row">
            <span>Saved so far</span>
            <strong className={isHidden && privacyMode === 'blur' ? 'is-blurred' : ''}>{displaySaved}</strong>
          </div>
          <div className="ins-card__progress-row">
            <span>Goal</span>
            <strong className={isHidden && privacyMode === 'blur' ? 'is-blurred' : ''}>{displayTarget}</strong>
          </div>
        </div>
      </div>

      {isAnimating && (
        <div className="ins-card__floating-text">
          +{formatCurrency(amount, currency)}
        </div>
      )}
    </section>
  )
}
