"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, FileText, Settings } from "lucide-react"

interface Stats {
  totalBooks: number
  totalChapters: number
  totalSubChapters: number
  totalCards: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    totalChapters: 0,
    totalSubChapters: 0,
    totalCards: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/books")
      const data = await res.json()

      if (data.books) {
        let totalChapters = 0
        let totalSubChapters = 0
        let totalCards = 0

        data.books.forEach((book: any) => {
          totalChapters += book.chapterCount || 0
          totalSubChapters += book.subChapterCount || 0
          totalCards += book.totalCards || 0
        })

        setStats({
          totalBooks: data.books.length,
          totalChapters,
          totalSubChapters,
          totalCards
        })
      }
    } catch (error) {
      console.error("获取统计失败:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground">欢迎来到管理后台</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              书籍总数
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              章节总数
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChapters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              小节总数
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubChapters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              卡片总数
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCards}</div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild className="bg-secondary text-secondary-foreground hover:!text-black">
              <a href="/admin/books">管理书籍</a>
            </Button>
            <Button asChild className="bg-secondary text-secondary-foreground hover:!text-black">
              <a href="/books">查看前台</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
