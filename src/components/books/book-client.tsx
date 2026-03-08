"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown } from "lucide-react"

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
  chapters: Chapter[]
}

interface SubChapterProgress {
  total: number
  completed: number
}

// 环形进度组件
function CircularProgress({ progress, size = 48, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference
  const isComplete = progress >= 1

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${isComplete ? 'text-green-500' : 'text-blue-500'}`}
        />
      </svg>
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  )
}

export function BookClient({ book }: { book: BookData }) {
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set()
  )
  const [progressMap, setProgressMap] = useState<Record<string, SubChapterProgress>>({})

  useEffect(() => {
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

  return (
    <div className="content-container py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold mt-2">{book.name}</h1>
        <p className="text-muted-foreground mt-1">
          {book.chapters.length} 个章节，{totalSubChapters} 个小节
        </p>
      </div>

      <div className="space-y-3">
        {book.chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className={`chapter-toggle ${!openChapters.has(chapter.id) ? 'collapsed' : ''}`}>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </span>
                {chapter.name}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {chapter.subChapters.length} 个小节
              </Badge>
            </button>
            {openChapters.has(chapter.id) && (
              <div className="p-4 pt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {chapter.subChapters.map((subChapter) => {
                  const progress = progressMap[subChapter.id]
                  const completedCount = progress?.completed || 0
                  const totalCount = progress?.total || subChapter._count.cards
                  const progressPercent = totalCount > 0 ? completedCount / totalCount : 0

                  return (
                    <Link key={subChapter.id} href={`/learn/${subChapter.id}`}>
                      <Card className="card-hover cursor-pointer bg-muted/30 hover:bg-muted/60">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base flex-1">{subChapter.name}</CardTitle>
                            <CircularProgress progress={progressPercent} size={44} strokeWidth={3} />
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {subChapter._count.cards} 张卡片
                            </Badge>
                            {progressPercent > 0 && progressPercent < 1 && (
                              <span className="text-xs text-muted-foreground">
                                {completedCount}/{totalCount}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
