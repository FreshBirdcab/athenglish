"use client"

import { useEffect, useState, useRef } from "react"

interface Star {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  type: 'twinkle' | 'fade'
}

interface TrailPoint {
  x: number
  y: number
}

export default function GalaxyBackground() {
  const [stars, setStars] = useState<Star[]>([])
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([])
  const [trailFading, setTrailFading] = useState(false)
  const [isMouseIn, setIsMouseIn] = useState(false)
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // 生成随机星星
    const newStars: Star[] = []
    for (let i = 0; i < 60; i++) {
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.8,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 5,
        type: 'twinkle'
      })
    }
    for (let i = 0; i < 20; i++) {
      newStars.push({
        id: 60 + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 6 + 4,
        delay: Math.random() * 8,
        type: 'fade'
      })
    }
    setStars(newStars)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let trailTimeout: NodeJS.Timeout

    // 使用全局鼠标监听，覆盖整个页面
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()

      // 基于整个窗口计算位置
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      // 鼠标光效在整个星空背景区域显示（页面下半部分或在整个背景容器内）
      if (e.clientY > rect.top) {
        setMousePos({ x, y })
        setIsMouseIn(true)

        // 视差偏移 - 基于整个窗口的位置
        const parallaxX = (x - 50) * 0.25
        const parallaxY = (y - 50) * 0.15
        setParallaxOffset({ x: parallaxX, y: parallaxY })

        // 计算移动距离添加尾迹
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
      } else {
        setIsMouseIn(false)
        setParallaxOffset({ x: 0, y: 0 })
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

  const twinkleStars = stars.filter(s => s.type === 'twinkle')
  const fadeStars = stars.filter(s => s.type === 'fade')

  return (
    <div className="galaxy-background" ref={containerRef}>
      {/* 前景星星 - 视差最大 */}
      <div
        className="galaxy-stars"
        style={{
          transform: `translate(${parallaxOffset.x * 1.5}px, ${parallaxOffset.y * 1.5}px)`,
          transition: 'transform 0.25s ease-out'
        }}
      >
        {twinkleStars.slice(0, 20).map((star) => (
          <div
            key={star.id}
            className="star star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              background: `hsl(${200 + Math.random() * 40} ${60 + Math.random() * 40}% ${70 + Math.random() * 30}%)`,
              boxShadow: `0 0 ${star.size * 2}px ${star.size * 0.5}px hsl(${200 + Math.random() * 40} ${60 + Math.random() * 40}% ${70 + Math.random() * 30}% / 0.5)`
            }}
          />
        ))}
      </div>

      {/* 中层星星 */}
      <div
        className="galaxy-stars"
        style={{
          transform: `translate(${parallaxOffset.x * 1}px, ${parallaxOffset.y * 1}px)`,
          transition: 'transform 0.25s ease-out'
        }}
      >
        {twinkleStars.slice(20, 40).map((star) => (
          <div
            key={star.id}
            className="star star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size * 0.7}px`,
              height: `${star.size * 0.7}px`,
              animationDuration: `${star.duration + 1}s`,
              animationDelay: `${star.delay}s`,
              background: `hsl(${200 + Math.random() * 40} ${50 + Math.random() * 30}% ${60 + Math.random() * 30}%)`
            }}
          />
        ))}
      </div>

      {/* 远层星星 - 视差最小 */}
      <div
        className="galaxy-stars"
        style={{
          transform: `translate(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px)`,
          transition: 'transform 0.25s ease-out'
        }}
      >
        {twinkleStars.slice(40).map((star) => (
          <div
            key={star.id}
            className="star star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size * 0.4}px`,
              height: `${star.size * 0.4}px`,
              animationDuration: `${star.duration + 2}s`,
              animationDelay: `${star.delay}s`,
              background: `hsl(${200 + Math.random() * 40} ${40 + Math.random() * 30}% ${50 + Math.random() * 30}%)`
            }}
          />
        ))}
      </div>

      {/* 生灭星星 */}
      <div
        className="galaxy-stars"
        style={{
          transform: `translate(${parallaxOffset.x * 0.8}px, ${parallaxOffset.y * 0.8}px)`,
          transition: 'transform 0.25s ease-out'
        }}
      >
        {fadeStars.map((star) => (
          <div
            key={star.id}
            className="star star-fade"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              background: `hsl(${200 + Math.random() * 40} ${60 + Math.random() * 40}% ${70 + Math.random() * 30}%)`,
              boxShadow: `0 0 ${star.size * 2}px ${star.size * 0.5}px hsl(${200 + Math.random() * 40} ${60 + Math.random() * 40}% ${70 + Math.random() * 30}% / 0.4)`
            }}
          />
        ))}
      </div>

      {/* 跟随鼠标的流星 */}
      {isMouseIn && (
        <>
          <div
            className="mouse-comet active"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`
            }}
          />
          {/* 动态尾迹 */}
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
                  background: `hsl(210 100% ${70 + progress * 25}%)`,
                  boxShadow: `0 0 ${size}px ${size * 0.5}px hsl(210 100% 90% / ${opacity * 0.6})`,
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
