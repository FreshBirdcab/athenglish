"use client"

import { useEffect, useState } from "react"

interface ConfettiProps {
  show: boolean
  x?: number  // 百分比位置
  y?: number  // 百分比位置
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  tx: number
  ty: number
  color: string
  delay: number
  size: number
}

export function Confetti({ show, x = 50, y = 50, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  const colors = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

  useEffect(() => {
    if (show) {
      const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.random() * 360) * (Math.PI / 180)
        const distance = 40 + Math.random() * 25
        return {
          id: i,
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 15,
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.1,
          size: Math.random() * 5 + 4,
        }
      })
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 1200)

      return () => clearTimeout(timer)
    }
  }, [show, x, y, onComplete])

  if (!show || particles.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '100%', height: '100%' }}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animation: `confetti-burst-${particle.id} 0.8s ease-out ${particle.delay}s forwards`,
            '--tx': `${particle.tx}px`,
            '--ty': `${particle.ty}px`,
          } as React.CSSProperties}
        />
      ))}
      {particles.map((particle) => (
        <style key={`style-${particle.id}`}>{`
          @keyframes confetti-burst-${particle.id} {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(${particle.tx}px, ${particle.ty}px) scale(0);
              opacity: 0;
            }
          }
        `}</style>
      ))}
    </div>
  )
}
