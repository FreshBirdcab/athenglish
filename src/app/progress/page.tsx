"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Flame, BookOpen, Target, TrendingUp, ChevronRight } from "lucide-react"

export default function ProgressPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<{
    totalCards: number
    learnedCards: number
    currentStreak: number
    longestStreak: number
    dailyStats: { date: string; count: number }[]
  } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setMounted(true)
      fetchData()
    }
  }, [status, session, router])

  const fetchData = async () => {
    if (!session?.user) return

    try {
      const res = await fetch("/api/progress")
      if (!res.ok) return

      const data = await res.json()

      setStats({
        totalCards: data.totalCards ?? 0,
        learnedCards: data.learnedCards ?? 0,
        currentStreak: data.currentStreak ?? 0,
        longestStreak: data.longestStreak ?? 0,
        dailyStats: data.dailyStats ?? []
      })
    } catch (error) {
      // 静默处理错误
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden hero-gradient py-13.5">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="relative content-container flex flex-col justify-center min-h-[150px]">
            <h1 className="text-3xl md:text-4xl font-bold hero-text mb-2 tracking-tight">
              学习统计
            </h1>
            <p className="hero-text-muted text-sm">记录你的学习痕迹</p>
          </div>
        </div>
        <div className="content-container py-8 -mt-6">
          <div className="animate-pulse space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const displayStats = stats || {
    totalCards: 0,
    learnedCards: 0,
    currentStreak: 0,
    longestStreak: 0,
    dailyStats: Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return { date: date.toLocaleDateString("zh-CN", { weekday: "short" }), count: 0 }
    })
  }

  const { totalCards, learnedCards, currentStreak, longestStreak, dailyStats } = displayStats
  const progressPercent = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0
  const maxCount = Math.max(...dailyStats.map(d => d.count), 1)

  // 计算今日学习数量
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = dailyStats.find(d => {
    const dateStr = new Date().toLocaleDateString("zh-CN", { weekday: "short" })
    return d.date === dateStr
  })?.count || 0

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部区域 */}
      <div className="relative overflow-hidden hero-gradient py-13.5">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative content-container flex flex-col justify-center min-h-[150px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 hero-link mb-4 text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 -rotate-90" />
            返回首页
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold hero-text mb-2 tracking-tight">
            学习统计
          </h1>
          <p className="hero-text-muted text-sm">记录你的学习痕迹</p>
        </div>
      </div>

      <div className="content-container py-8 -mt-6">
        {/* 统计卡片 - 3列布局 */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {/* 连续学习 */}
          <Card
            className="overflow-hidden"
            style={{ animation: 'fadeSlideIn 0.4s ease-out forwards', animationDelay: '0.1s', opacity: 0 }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">连续学习</p>
                  <div className="text-3xl font-bold">{currentStreak} <span className="text-base font-normal">天</span></div>
                  <p className="text-xs text-muted-foreground mt-1">最长 {longestStreak} 天</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                  <Flame className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 今日学习 */}
          <Card
            className="overflow-hidden"
            style={{ animation: 'fadeSlideIn 0.4s ease-out forwards', animationDelay: '0.2s', opacity: 0 }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">今日学习</p>
                  <div className="text-3xl font-bold">{todayCount} <span className="text-base font-normal">张</span></div>
                  <p className="text-xs text-muted-foreground mt-1">今日已标记</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 累计已学 */}
          <Card
            className="overflow-hidden"
            style={{ animation: 'fadeSlideIn 0.4s ease-out forwards', animationDelay: '0.3s', opacity: 0 }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">累计已学</p>
                  <div className="text-3xl font-bold">{learnedCards} <span className="text-base font-normal">/ {totalCards}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">总卡片数</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                  <Target className="w-7 h-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 学习进度条 */}
        <Card
          className="overflow-hidden mb-8"
          style={{ animation: 'fadeSlideIn 0.4s ease-out forwards', animationDelay: '0.4s', opacity: 0 }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">总体学习进度</span>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              已标记 {learnedCards} 张，共 {totalCards} 张卡片
            </p>
          </CardContent>
        </Card>

        {/* 最近7天学习情况 */}
        <Card
          className="overflow-hidden"
          style={{ animation: 'fadeSlideIn 0.4s ease-out forwards', animationDelay: '0.5s', opacity: 0 }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">最近7天学习</h2>
            </div>
            <div className="flex justify-between items-end h-40 gap-2">
              {dailyStats.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-28">
                    <span className="text-xs font-medium text-primary mb-1">{day.count > 0 ? day.count : ''}</span>
                    <div
                      className="w-full max-w-[40px] bg-primary/80 rounded-t-md"
                      style={{
                        height: mounted ? `${Math.max(8, (day.count / maxCount) * 100)}%` : '0%',
                        minHeight: '2px',
                        transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: `${0.3 + i * 0.1}s`
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">{day.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
