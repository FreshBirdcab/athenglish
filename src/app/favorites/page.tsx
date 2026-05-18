"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Heart, Calendar, BookOpen, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FavoriteItem {
  id: string
  type: "word" | "sentence"
  createdAt: string
  cardIndex: number
  card: {
    id: string
    contentPrimary: string
    contentSecondary: string | null
    subChapterId: string
    subChapter: {
      name: string
      chapter: {
        name: string
        book: {
          id: string
          name: string
          type: string
        }
      }
    }
  }
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [activeTab, setActiveTab] = useState("date")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setMounted(true)
      fetchFavorites()
    }
  }, [status, session, router])

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/favorites")
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
    }
  }

  // 按日期分组
  const groupByDate = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const groups: { [key: string]: FavoriteItem[] } = {
      "今天": [],
      "昨天": [],
      "本周": [],
      "本月": [],
      "更早": []
    }

    favorites.forEach(fav => {
      const favDate = new Date(fav.createdAt)
      if (favDate >= today) {
        groups["今天"].push(fav)
      } else if (favDate >= yesterday) {
        groups["昨天"].push(fav)
      } else if (favDate >= weekAgo) {
        groups["本周"].push(fav)
      } else if (favDate >= monthAgo) {
        groups["本月"].push(fav)
      } else {
        groups["更早"].push(fav)
      }
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }

  // 按书籍分组
  const groupByBook = () => {
    const groups: { [bookId: string]: { name: string; type: string; items: FavoriteItem[] } } = {}

    favorites.forEach(fav => {
      const book = fav.card.subChapter.chapter.book
      if (!groups[book.id]) {
        groups[book.id] = { name: book.name, type: book.type, items: [] }
      }
      groups[book.id].items.push(fav)
    })

    return Object.entries(groups).map(([id, data]) => ({
      bookId: id,
      ...data
    }))
  }

  // 按类型分组
  const groupByType = () => {
    const groups: { [key: string]: FavoriteItem[] } = {
      "单词": [],
      "句型": [],
      "语料": []
    }

    favorites.forEach(fav => {
      if (fav.type === "word") {
        groups["单词"].push(fav)
      } else if (fav.type === "sentence") {
        groups["句型"].push(fav)
      } else {
        groups["语料"].push(fav)
      }
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vocabulary": return <BookOpen className="h-4 w-4" />
      case "sentence": return <Layers className="h-4 w-4" />
      case "corpus": return <Layers className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "word": return "单词"
      case "sentence": return "句型"
      default: return "语料"
    }
  }

  const renderFavoriteCard = (fav: FavoriteItem, showBook: boolean = false) => (
    <Link key={fav.id} href={`/learn/${fav.card.subChapterId}?cardIndex=${fav.cardIndex}`}>
      <Card className="card-hover cursor-pointer mb-3">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-4">
          <div className="flex items-center gap-2">
            <Badge variant={fav.type === "word" ? "default" : "secondary"}>
              {getTypeLabel(fav.type)}
            </Badge>
            {showBook && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {fav.card.subChapter.chapter.book.name}
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <CardTitle className="text-base font-semibold">
            {fav.card.contentPrimary}
          </CardTitle>
          {fav.card.contentSecondary && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {fav.card.contentSecondary}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {fav.card.subChapter.name}
          </p>
        </CardContent>
      </Card>
    </Link>
  )

  const dateGroups = groupByDate()
  const bookGroups = groupByBook()
  const typeGroups = groupByType()

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
              我的收藏
            </h1>
            <p className="hero-text-muted text-sm">收藏你的学习内容</p>
          </div>
        </div>
        <div className="content-container py-8 -mt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

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
            我的收藏
          </h1>
          <p className="hero-text-muted text-sm">收藏 {favorites.length} 条学习内容</p>
        </div>
      </div>

      <div className="content-container py-8 -mt-6">
        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">还没有收藏内容</p>
            <p className="text-sm text-muted-foreground mt-2">在学习过程中点击 ❤️ 添加收藏</p>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="date" className="gap-2">
                <Calendar className="h-4 w-4" />
                按日期
              </TabsTrigger>
              <TabsTrigger value="book" className="gap-2">
                <BookOpen className="h-4 w-4" />
                按书籍
              </TabsTrigger>
              <TabsTrigger value="type" className="gap-2">
                <Layers className="h-4 w-4" />
                按类型
              </TabsTrigger>
            </TabsList>

            {/* 按日期分组 */}
            <TabsContent value="date" className="space-y-6">
              {dateGroups.map(([label, items]) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg">{label}</h3>
                    <span className="text-sm text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map(fav => (
                      <div key={fav.id} className="grid gap-4 md:col-span-2 lg:col-span-1">
                        {renderFavoriteCard(fav, true)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* 按书籍分组 */}
            <TabsContent value="book" className="space-y-6">
              {bookGroups.map(group => (
                <div key={group.bookId}>
                  <div className="flex items-center gap-2 mb-3">
                    {getTypeIcon(group.type)}
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <span className="text-sm text-muted-foreground">({group.items.length})</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.items.map(fav => (
                      <div key={fav.id} className="md:col-span-2 lg:col-span-1">
                        {renderFavoriteCard(fav, false)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* 按类型分组 */}
            <TabsContent value="type" className="space-y-6">
              {typeGroups.map(([label, items]) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-lg">{label}</h3>
                    <span className="text-sm text-muted-foreground">({items.length})</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map(fav => (
                      <div key={fav.id} className="md:col-span-2 lg:col-span-1">
                        {renderFavoriteCard(fav, true)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
