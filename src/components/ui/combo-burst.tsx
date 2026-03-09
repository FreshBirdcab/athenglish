"use client"

import { useEffect, useState } from "react"

interface ComboBurstProps {
  show: boolean
  combo: number
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  distance: number
  color: string
  size: number
}

export function ComboBurst({ show, combo, onComplete }: ComboBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  const colors = ["#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]

  useEffect(() => {
    if (show && combo >= 2) {
      setIsAnimating(true)

      // 创建爆炸粒子
      const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360 * (Math.PI / 180)
        return {
          id: i,
          x: 0,
          y: 0,
          angle,
          distance: 40 + Math.random() * 30,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 3,
        }
      })
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setIsAnimating(false)
        setParticles([])
        onComplete?.()
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [show, combo, onComplete])

  if (!show || !isAnimating || combo < 2) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* 中心文字 */}
      <div className="relative">
        <span
          className="relative z-10 text-6xl font-black text-white drop-shadow-lg"
          style={{
            animation: 'combo-scale 0.6s ease-out forwards',
          }}
        >
          {combo}
        </span>
        <span
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-yellow-300 whitespace-nowrap z-10"
          style={{
            animation: 'combo-fade-up 0.6s ease-out forwards',
          }}
        >
          COMBO!
        </span>
        {/* 光晕背景 */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 blur-xl"
          style={{
            animation: 'combo-pulse 0.6s ease-out forwards',
          }}
        />
      </div>

      {/* 爆炸粒子 */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animation: `particle-burst-${particle.id} 0.5s ease-out forwards`,
            ['--tx' as any]: `${Math.cos(particle.angle) * particle.distance}px`,
            ['--ty' as any]: `${Math.sin(particle.angle) * particle.distance}px`,
          }}
        />
      ))}

      {/* 动态生成的 keyframes */}
      <style>{`
        @keyframes combo-scale {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes combo-fade-up {
          0% { transform: translateX(-50%) translateY(10px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes combo-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        ${particles.map(p => `
          @keyframes particle-burst-${p.id} {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(${Math.cos(p.angle) * p.distance}px, ${Math.sin(p.angle) * p.distance}px) scale(0); opacity: 0; }
          }
        `).join('\n')}
      `}</style>
    </div>
  )
}
