import { useEffect, useState } from 'react'
import { getSetting, setSetting } from '../storage/settingsStorage'

// Helper: Convert ArrayBuffer to Base64
function bufferToBase64(buf) {
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return window.btoa(binary)
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToBuffer(base64) {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsSupported(available))
        .catch(() => setIsSupported(false))
    }

    getSetting('biometricsEnabled').then(enabled => {
      setIsEnabled(!!enabled)
      if (!enabled) setIsUnlocked(true)
    })
  }, [])

  async function enableBiometrics() {
    if (!isSupported) return false
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'OverStack' },
          user: {
            id: new Uint8Array(16),
            name: 'user@overstack.app',
            displayName: 'OverStack User'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      })
      
      // Save the credential ID so we can use it for unlocking
      const rawIdB64 = bufferToBase64(credential.rawId)
      localStorage.setItem('overstack_biometric_id', rawIdB64)
      
      await setSetting('biometricsEnabled', true)
      setIsEnabled(true)
      setIsUnlocked(true)
      return true
    } catch (err) {
      console.warn('Biometric registration failed', err)
      return false
    }
  }

  async function disableBiometrics() {
    await setSetting('biometricsEnabled', false)
    localStorage.removeItem('overstack_biometric_id')
    setIsEnabled(false)
    setIsUnlocked(true)
  }

  async function unlock() {
    try {
      const rawIdB64 = localStorage.getItem('overstack_biometric_id')
      if (!rawIdB64) throw new Error('No biometric credentials found. Please disable and re-enable in settings.')

      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: base64ToBuffer(rawIdB64),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      })
      
      setIsUnlocked(true)
      return true
    } catch (err) {
      console.warn('Biometric unlock failed', err)
      return false
    }
  }

  return { isSupported, isEnabled, isUnlocked, enableBiometrics, disableBiometrics, unlock }
}
