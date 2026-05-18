"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, BookOpen, Sparkles, Target, Zap } from "lucide-react"

interface SubChapter {
  id: string
  name: string
  _count: {
    cards: number
  }
}

interface Chapter {
  id: string
  name: string
  subChapters: SubChapter[]
}

interface BookData {
  id: string
  name: string
  description: string | null
  chapters: Chapter[]
}

interface SubChapterProgress {
  total: number
  completed: number
}

// 闪烁的星星组件
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  )
}

// 环形进度组件 - 带入场动画和发光效果
function CircularProgress({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - animatedProgress * circumference
  const isComplete = animatedProgress >= 1
  const hasProgress = animatedProgress > 0

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  // 进度颜色
  const getProgressColor = () => {
    if (animatedProgress > 0) return "hsl(200, 55%, 45%)" // accent-蓝色（有进度时）
    return "hsl(210, 40%, 80%)" // 浅蓝色（未开始时）
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* 发光背景 - 有进度时显示 */}
      {hasProgress && (
        <div
          className="absolute inset-0 rounded-full opacity-25 blur-md"
          style={{
            background: `radial-gradient(circle, hsl(200, 55%, 45%) 0%, transparent 70%)`
          }}
        />
      )}
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* 背景圆环 - 浅色 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: hasProgress ? `drop-shadow(0 0 3px ${getProgressColor()}30)` : 'none'
          }}
        />
      </svg>
      {isComplete ? (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center animate-bounce-subtle">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      ) : hasProgress ? (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="text-xs font-bold text-foreground/70">
            {Math.round(animatedProgress * 100)}%
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function BookClient({ book }: { book: BookData }) {
  const searchParams = useSearchParams()
  const fromSubChapterId = searchParams.get("from")
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set())
  const [progressMap, setProgressMap] = useState<Record<string, SubChapterProgress>>({})
  const [mounted, setMounted] = useState(false)
  // 记录从学习页返回的状态，用于跳过动画
  const [isReturningFromStudy, setIsReturningFromStudy] = useState(false)
  const chapterRefs = useRef<Record<string, HTMLDivElement>>({})

  // 当从学习页返回时，自动展开对应的章节并滚动到位置
  useEffect(() => {
    if (fromSubChapterId && mounted && book.chapters?.length > 0) {
      // 标记为从学习页返回，跳过动画
      setIsReturningFromStudy(true)

      // 找到对应的章节
      const targetChapter = book.chapters.find(chapter =>
        chapter.subChapters.some(sc => sc.id === fromSubChapterId)
      )

      if (targetChapter) {
        // 使用函数式更新确保状态正确更新
        setOpenChapters(prev => {
          const newSet = new Set(prev)
          newSet.add(targetChapter.id)
          return newSet
        })

        // 滚动到对应章节
        setTimeout(() => {
          const chapterEl = chapterRefs.current[targetChapter.id]
          if (chapterEl) {
            chapterEl.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }, 200)
      }
    }
  }, [fromSubChapterId, mounted, book.chapters])

  useEffect(() => {
    setMounted(true)
    fetch("/api/subchapter-progress")
      .then(res => res.json())
      .then(data => {
        if (data.progress) {
          setProgressMap(data.progress)
        }
      })
      .catch(console.error)
  }, [])

  const toggleChapter = (chapterId: string) => {
    setOpenChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  const totalSubChapters = book.chapters.reduce((acc, ch) => acc + ch.subChapters.length, 0)
  const totalCards = book.chapters.reduce((acc, ch) =>
    acc + ch.subChapters.reduce((sum, sc) => sum + sc._count.cards, 0), 0
  )

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部区域 - 使用主色渐变 */}
      <div className="relative overflow-hidden hero-gradient py-13.5">
        {/* 装饰性模糊光晕 - 更低调 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative content-container flex flex-col justify-center min-h-[150px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 hero-link mb-4 text-sm font-medium"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            返回首页
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/25">
              <BookOpen className="w-7 h-7 hero-icon" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold hero-text mb-2 tracking-tight">
                {book.name}
              </h1>
              {book.description && (
                <p className="hero-text-muted text-sm mb-3">{book.description}</p>
              )}
              <div className="flex items-center gap-4 hero-text-muted text-sm">
                <span className="flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  {book.chapters.length} 个章节
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  {totalSubChapters} 个小节
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {totalCards} 张卡片
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container py-8 -mt-6">
        <div className="space-y-3">
          {book.chapters.map((chapter, chapterIndex) => {
            const isOpen = openChapters.has(chapter.id)

            // 计算章节进度
            const chapterProgress = chapter.subChapters.reduce(
              (acc, sc) => {
                const progress = progressMap[sc.id]
                return {
                  completed: acc.completed + (progress?.completed || 0),
                  total: acc.total + (progress?.total || sc._count.cards)
                }
              },
              { completed: 0, total: 0 }
            )
            const chapterPercent = chapterProgress.total > 0 ? chapterProgress.completed / chapterProgress.total : 0

            return (
              <div
                key={chapter.id}
                ref={(el) => { if (el) chapterRefs.current[chapter.id] = el }}
                id={`chapter-${chapter.id}`}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                style={{
                  // 从学习页返回时跳过动画，直接显示
                  animationName: isReturningFromStudy ? 'none' : 'fadeSlideIn',
                  animationDuration: '0.4s',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'forwards',
                  // 限制最大延迟为1.5秒，避免章节过多时等待过长
                  animationDelay: isReturningFromStudy ? '0s' : `${Math.min(chapterIndex, 18) * 0.08}s`,
                  opacity: isReturningFromStudy ? 1 : 0
                }}
              >
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-all duration-300 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {/* 章节序号徽章 */}
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="text-sm font-semibold text-primary">
                        {chapterIndex + 1}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        {chapter.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {chapter.subChapters.length} 个小节 · {chapterProgress.completed}/{chapterProgress.total} 完成
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 章节进度条 */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                          style={{ width: `${chapterPercent * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {Math.round(chapterPercent * 100)}%
                      </span>
                    </div>
                    {/* 展开图标 */}
                    <div className={`w-7 h-7 rounded-full bg-muted flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>

                {/* 章节内容 */}
                {isOpen && (
                  <div className="p-4 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {chapter.subChapters.map((subChapter, subIndex) => {
                        const progress = progressMap[subChapter.id]
                        const completedCount = progress?.completed || 0
                        const totalCount = progress?.total || subChapter._count.cards
                        const progressPercent = totalCount > 0 ? completedCount / totalCount : 0
                        const isComplete = progressPercent >= 1

                        return (
                          <Link
                            key={subChapter.id}
                            href={`/learn/${subChapter.id}`}
                            className="group"
                            style={{
                              animationName: isOpen ? 'fadeSlideUp' : 'none',
                              animationDuration: '0.3s',
                              animationTimingFunction: 'ease-out',
                              animationFillMode: 'forwards',
                              // 限制最大延迟为0.8秒
                              animationDelay: `${Math.min(subIndex, 20) * 0.04}s`,
                              opacity: 0
                            }}
                          >
                            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-border/50 hover:border-primary/20 bg-background/80">
                              <CardHeader className="p-4 pb-2">
                                <div className="flex items-start justify-between gap-3">
                                  <CardTitle className="text-sm font-medium text-foreground line-clamp-2 flex-1 leading-tight">
                                    {subChapter.name}
                                  </CardTitle>
                                  <CircularProgress progress={progressPercent} size={40} strokeWidth={3} />
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      isComplete
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'bg-muted/50 text-muted-foreground'
                                    }`}
                                  >
                                    {subChapter._count.cards} 张卡片
                                  </Badge>
                                  {progressPercent > 0 && progressPercent < 1 && (
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {completedCount}/{totalCount}
                                    </span>
                                  )}
                                  {isComplete && (
                                    <span className="text-xs font-medium text-accent flex items-center gap-1">
                                      <SparkleIcon className="w-3 h-3" />
                                      已完成
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
