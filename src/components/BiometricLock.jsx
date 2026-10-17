import { Fingerprint, Lock } from 'lucide-react'
import { useBiometrics } from '../hooks/useBiometrics'
import './BiometricLock.css'

export default function BiometricLock() {
  const { isEnabled, isUnlocked, unlock } = useBiometrics()

  if (!isEnabled || isUnlocked) return null

  return (
    <div className="bio-lock">
      <div className="bio-lock__content">
        <div className="bio-lock__icon">
          <Lock size={32} />
        </div>
        <h2 className="bio-lock__title">OverStack Locked</h2>
        <p className="bio-lock__sub">Verify your identity to access your savings.</p>
        
        <button className="bio-lock__btn" onClick={unlock}>
          <Fingerprint size={24} />
          Unlock with Biometrics
        </button>
      </div>
    </div>
  )
}
