export function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime)
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime + startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + startTime)
      osc.stop(ctx.currentTime + startTime + duration)
    }

    playTone(523.25, 0, 0.15) // C5
    playTone(659.25, 0.1, 0.3) // E5
  } catch (e) {
    console.warn('Audio blocked', e)
  }
}

export function vibrateSuccess() {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100])
  }
}

export function triggerSaveFeedback() {
  playSuccessSound()
  vibrateSuccess()
}
