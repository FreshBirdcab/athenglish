"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "@/components/providers/theme-provider"
import { playPianoKeySound } from "@/lib/sounds"

interface GlowLetter {
  id: number
  char: string
  x: number
  y: number
  color: string
}

interface Particle {
  id: number
  tx: number
  ty: number
  size: number
  color: string
}

interface ParticleBurst {
  id: number
  char: string
  x: number
  y: number
  particles: Particle[]
}

let letterId = 0
let burstId = 0

// 低调灰蓝色调
const BEAUTIFUL_COLORS = [
  '#64748b', // slate-500
  '#475569', // slate-600
  '#94a3b8', // slate-400
  '#546e7a', // blue-gray-600
  '#78909c', // blue-gray-500
  '#334155', // slate-700
  '#8391a1', // custom gray
  '#5c6b7a', // custom gray
  '#6b7a8d', // custom gray
  '#4a5568', // gray-600
  '#718096', // gray-500
  '#526477', // custom gray
]

export default function PianoKeyHero() {
  const { theme } = useTheme()
  const [letters, setLetters] = useState<GlowLetter[]>([])
  const [bursts, setBursts] = useState<ParticleBurst[]>([])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (theme !== "dark") return

    const char = e.key.toLowerCase()
    if (!/^[a-z]$/.test(char)) return

    playPianoKeySound(char)

    const x = Math.random() * 60 + 20
    const y = Math.random() * 40 + 30

    // 随机选择一个美丽的颜色
    const color = BEAUTIFUL_COLORS[Math.floor(Math.random() * BEAUTIFUL_COLORS.length)]

    const newLetter: GlowLetter = {
      id: letterId++,
      char: char.toUpperCase(),
      x,
      y,
      color,
    }

    setLetters(prev => [...prev, newLetter])

    // 1秒后字母消失，同时触发粒子爆发
    setTimeout(() => {
      // 移除字母
      setLetters(prev => prev.filter(l => l.id !== newLetter.id))

      // 创建粒子爆发 - 使用字母的颜色
      const particles: Particle[] = []
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = 30 + Math.random() * 50
        particles.push({
          id: i,
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance,
          size: 4 + Math.random() * 4,
          color: newLetter.color,
        })
      }

      const burst: ParticleBurst = {
        id: burstId++,
        char: char.toUpperCase(),
        x,
        y,
        particles,
      }
      setBursts(prev => [...prev, burst])

      // 粒子动画结束
      setTimeout(() => {
        setBursts(prev => prev.filter(b => b.id !== burst.id))
      }, 600)
    }, 1000)
  }, [theme])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  if (theme !== "dark") return null

  return (
    <>
      {letters.map((letter) => (
        <div
          key={letter.id}
          className="glow-letter"
          style={{
            left: `${letter.x}%`,
            top: `${letter.y}%`,
          }}
        >
          <span
            className="glow-letter-text"
            style={{
              color: letter.color,
              textShadow: `0 0 20px ${letter.color}, 0 0 40px ${letter.color}, 0 0 60px ${letter.color}`,
            }}
          >
            {letter.char}
          </span>
        </div>
      ))}

      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="particle-burst"
          style={{
            left: `${burst.x}%`,
            top: `${burst.y}%`,
          }}
        >
          {burst.particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </>
  )
}
