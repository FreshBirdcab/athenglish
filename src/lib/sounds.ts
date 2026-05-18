"use client"

// 使用 Web Audio API 生成音效，无需外部音频文件

let audioContext: AudioContext | null = null

// 音效开关状态（不影响琴音模式）
let soundEnabled: boolean = true

export function isSoundEnabled(): boolean {
  return soundEnabled
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled
}

export function getSoundEnabledFromStorage(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('soundEnabled')
    return saved === null ? true : saved === 'true' // 默认开启
  }
  return true
}

export function saveSoundEnabledToStorage(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('soundEnabled', String(enabled))
  }
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// 答对音效 - 升调叮咚声
export function playCorrectSound() {
  if (!soundEnabled) return
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
  if (!soundEnabled) return
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
  if (!soundEnabled) return
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

// 有道词典发音
export function playYoudaoAudio(word: string) {
  try {
    const audio = new Audio(`https://dict.youdao.com/dictvoice?type=1&audio=${encodeURIComponent(word)}`)
    audio.play()
  } catch (e) {
    console.warn('Youdao audio playback failed:', e)
  }
}

// 钢琴音效 - 根据字母生成对应音高
export function playPianoKeySound(char: string) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // 字母到音高的映射 (基于C大调)
    const charToNote: Record<string, number> = {
      // 白键 (C-D-E-F-G-A-B)
      'a': 261.63, // C4
      'b': 293.66, // D4
      'c': 329.63, // E4
      'd': 349.23, // F4
      'e': 392.00, // G4
      'f': 440.00, // A4
      'g': 493.88, // B4
      'h': 523.25, // C5
      'i': 587.33, // D5
      'j': 659.25, // E5
      'k': 698.46, // F5
      'l': 783.99, // G5
      'm': 880.00, // A5
      'n': 987.77, // B5
      'o': 1046.50, // C6
      'p': 1174.66, // D6
      'q': 1318.51, // E6
      'r': 1396.91, // F6
      's': 1567.98, // G6
      't': 1760.00, // A6
      'u': 1975.53, // B6
      'v': 2093.00, // C7
      'w': 2349.32, // D7
      'x': 2637.02, // E7
      'y': 2793.83, // F7
      'z': 3135.96, // G7
    }

    // 获取对应字母的频率，如果是其他字符则使用默认频率
    const baseFreq = charToNote[char.toLowerCase()] || 440

    // 创建钢琴音色 - 使用多个振荡器混合
    // 1. 主音色 - 正弦波
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(baseFreq, now)

    // 2. 泛音 - 三角波，增加钢琴的质感
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(baseFreq, now)

    // 3. 高频泛音 - 使声音更清脆
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(baseFreq * 2, now)

    // 音量包络 - 钢琴的敲击感
    const volume = 0.15
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(volume, now + 0.005)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

    gain2.gain.setValueAtTime(0, now)
    gain2.gain.linearRampToValueAtTime(volume * 0.3, now + 0.005)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    gain3.gain.setValueAtTime(0, now)
    gain3.gain.linearRampToValueAtTime(volume * 0.1, now + 0.003)
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    // 启动和停止
    osc1.start(now)
    osc1.stop(now + 0.8)
    osc2.start(now)
    osc2.stop(now + 0.5)
    osc3.start(now)
    osc3.stop(now + 0.3)
  } catch (e) {
    console.warn('Piano sound playback failed:', e)
  }
}
