import { useState, useEffect } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { formatCurrency, currencySymbol } from '../utils/currency'
import { triggerSaveFeedback } from '../utils/feedback'
import './InsuranceCard.css'

export default function InsuranceCard({ 
  amount = 3000, 
  isPaid = false, 
  currency = 'KSh', 
  onConfirm,
  isHidden = false,
  privacyMode = 'dots'
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

  // Privacy Masking Logic
  let displayAmount = formatCurrency(amount, currency)
  if (isHidden) {
    if (privacyMode === 'stars') displayAmount = `${currencySymbol(currency)} ******`
    else if (privacyMode === 'dots') displayAmount = `${currencySymbol(currency)} ••••••`
  }

  return (
    <section className={`ins-card ${paid ? 'is-paid' : 'is-pending'}`}>
      <div className="ins-card__head">
        <div className="ins-card__title">
          <ShieldCheck size={18} />
          Insurance Fund
        </div>
        <span className="ins-card__badge">Required</span>
      </div>

      <div className="ins-card__body">
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

      {isAnimating && (
        <div className="ins-card__floating-text">
          +{formatCurrency(amount, currency)}
        </div>
      )}
    </section>
  )
}
