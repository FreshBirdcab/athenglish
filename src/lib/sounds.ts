"use client"

// 使用 Web Audio API 生成音效，无需外部音频文件

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// 答对音效 - 升调叮咚声
export function playCorrectSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // 创建多个振荡器产生和谐的叮咚声
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5 (C大三和弦)

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, now)

      // 音量包络
      gainNode.gain.setValueAtTime(0, now + i * 0.05)
      gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.05 + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3)

      oscillator.start(now + i * 0.05)
      oscillator.stop(now + i * 0.05 + 0.3)
    })
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

// 答错音效 - 低沉buzz声
export function playWrongSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(150, now)
    oscillator.frequency.linearRampToValueAtTime(100, now + 0.2)

    // 音量包络
    gainNode.gain.setValueAtTime(0.2, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

    oscillator.start(now)
    oscillator.stop(now + 0.25)
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

// 连击音效 - 更强烈的叮咚
export function playComboSound(combo: number) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // 连击数越多，音调越高
    const baseFreq = 523.25 + (combo - 2) * 50 // 从C5开始，每连击+1升高半个音
    const frequencies = [
      baseFreq,
      baseFreq * 1.25, // 大三度
      baseFreq * 1.5,  // 纯五度
      baseFreq * 2     // 八度
    ]

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, now)

      // 音量包络 - 更响亮
      gainNode.gain.setValueAtTime(0, now + i * 0.03)
      gainNode.gain.linearRampToValueAtTime(0.2, now + i * 0.03 + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.4)

      oscillator.start(now + i * 0.03)
      oscillator.stop(now + i * 0.03 + 0.4)
    })
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}
