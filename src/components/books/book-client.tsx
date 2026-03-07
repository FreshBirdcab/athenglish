"use client"

import Link from "next/link"
import { useState } from "react"
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

export function BookClient({ book }: { book: BookData }) {
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set()
  )

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
                {chapter.subChapters.map((subChapter) => (
                  <Link key={subChapter.id} href={`/learn/${subChapter.id}`}>
                    <Card className="card-hover cursor-pointer bg-muted/30 hover:bg-muted/60">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{subChapter.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Badge variant="outline" className="text-xs">
                          {subChapter._count.cards} 张卡片
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
