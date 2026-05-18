"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface Star {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  phase: 'appearing' | 'stable' | 'fading'
  duration: number
}

interface TrailPoint {
  x: number
  y: number
}

export default function GalaxyBackground() {
  const [stars, setStars] = useState<Star[]>([])
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [isMouseIn, setIsMouseIn] = useState(false)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 })
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([])
  const [trailFading, setTrailFading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMouseRef = useRef({ x: 0, y: 0 })

  // 创建星星
  const createStar = useCallback((id: number): Star => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      opacity: 0,
      phase: 'appearing',
      duration: Math.random() * 8 + 4,
    }
  }, [])

  // 初始化星星 - 90颗
  useEffect(() => {
    const initialStars = Array.from({ length: 90 }, (_, i) => createStar(i))
    setStars(initialStars)
  }, [createStar])

  // 更新星星状态
  useEffect(() => {
    const interval = setInterval(() => {
      setStars(prev => prev.map(star => {
        const elapsed = (Date.now() / 1000) % star.duration
        const cycleTime = elapsed / star.duration

        if (cycleTime < 0.15) {
          return { ...star, phase: 'appearing', opacity: cycleTime / 0.15 }
        } else if (cycleTime > star.duration / (star.duration + 4) - 0.2) {
          const fadeProgress = (cycleTime - (star.duration / (star.duration + 4) - 0.2)) / 0.2
          return { ...star, phase: 'fading', opacity: Math.max(0, 1 - fadeProgress) }
        } else {
          const flicker = Math.sin(Date.now() / 800 + star.id * 0.5) * 0.25 + 0.75
          return { ...star, phase: 'stable', opacity: flicker }
        }
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let trailTimeout: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      if (e.clientY > rect.top) {
        setMousePos({ x, y })
        setIsMouseIn(true)

        const parallaxX = (x - 50) * 0.25
        const parallaxY = (y - 50) * 0.15
        setParallaxOffset({ x: parallaxX, y: parallaxY })

        const dx = x - prevMouseRef.current.x
        const dy = y - prevMouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 0.3) {
          setTrailPoints(prev => {
            const newTrail = [...prev, { x, y }]
            if (newTrail.length > 15) newTrail.shift()
            return newTrail
          })
          prevMouseRef.current = { x, y }

          if (trailTimeout) clearTimeout(trailTimeout)
          trailTimeout = setTimeout(() => {
            setTrailFading(true)
            setTimeout(() => {
              setTrailPoints([])
              setTrailFading(false)
            }, 300)
          }, 150)
        }
      }
    }

    const handleMouseLeave = () => {
      setIsMouseIn(false)
      setTrailFading(true)
      setTimeout(() => {
        setTrailPoints([])
        setTrailFading(false)
      }, 300)
      setParallaxOffset({ x: 0, y: 0 })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseLeave)
      if (trailTimeout) clearTimeout(trailTimeout)
    }
  }, [])

  return (
    <div className="galaxy-background" ref={containerRef}>
      {/* 外层星星 - 旋转最慢 */}
      <div
        className="stars-ring stars-rotate-slow"
        style={{
          '--px': `${parallaxOffset.x * 0.5}px`,
          '--py': `${parallaxOffset.y * 0.5}px`,
        } as React.CSSProperties}
      >
        {stars.slice(0, 30).map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              background: `hsl(${210 + Math.random() * 30} ${70 + Math.random() * 30}% ${70 + Math.random() * 20}%)`,
              boxShadow: `0 0 ${star.size * 2}px ${star.size * 0.6}px hsl(${210 + Math.random() * 30} 80% 80% / 0.4)`,
              transition: 'opacity 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* 中层星星 - 旋转中等 */}
      <div
        className="stars-ring stars-rotate-medium"
        style={{
          '--px': `${parallaxOffset.x * 0.3}px`,
          '--py': `${parallaxOffset.y * 0.3}px`,
        } as React.CSSProperties}
      >
        {stars.slice(30, 60).map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size * 0.8}px`,
              height: `${star.size * 0.8}px`,
              opacity: star.opacity,
              background: `hsl(${210 + Math.random() * 30} ${70 + Math.random() * 30}% ${70 + Math.random() * 20}%)`,
              boxShadow: `0 0 ${star.size * 1.5}px ${star.size * 0.4}px hsl(${210 + Math.random() * 30} 80% 80% / 0.3)`,
              transition: 'opacity 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* 内层星星 - 旋转最快 */}
      <div
        className="stars-ring stars-rotate-fast"
        style={{
          '--px': `${parallaxOffset.x * 0.15}px`,
          '--py': `${parallaxOffset.y * 0.15}px`,
        } as React.CSSProperties}
      >
        {stars.slice(40).map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size * 0.6}px`,
              height: `${star.size * 0.6}px`,
              opacity: star.opacity,
              background: `hsl(${210 + Math.random() * 30} ${60 + Math.random() * 30}% ${60 + Math.random() * 20}%)`,
              transition: 'opacity 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* 鼠标流星 */}
      {isMouseIn && (
        <>
          <div
            className="mouse-comet active"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`
            }}
          />
          {/* 尾迹 */}
          {trailPoints.map((point, index) => {
            const progress = (index + 1) / trailPoints.length
            const opacity = progress * 0.8
            const size = progress * 6
            return (
              <div
                key={index}
                className="comet-trail-segment"
                style={{
                  position: 'absolute',
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: `hsl(210 ${30 + progress * 30}% ${60 + progress * 25}%)`,
                  boxShadow: `0 0 ${size}px ${size * 0.5}px hsl(210 45% 82% / ${opacity * 0.4})`,
                  opacity: trailFading ? 0 : opacity,
                  transform: 'translate(-50%, -50%)',
                  transition: trailFading ? 'opacity 0.3s ease-out' : 'none'
                }}
              />
            )
          })}
        </>
      )}
    </div>
  )
}
