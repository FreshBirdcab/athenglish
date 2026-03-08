import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { BookOpen, MessageCircle, PenTool, Layers, Sparkles, Star } from "lucide-react"

async function getBooks() {
  const books = await prisma.book.findMany({
    include: {
      chapters: {
        include: {
          subChapters: {
            include: {
              _count: {
                select: { cards: true }
              }
            }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  })
  return books
}

function getBookStats(book: Awaited<ReturnType<typeof getBooks>>[0]) {
  const chapterCount = book.chapters.length
  const subChapterCount = book.chapters.reduce((acc, ch) => acc + ch.subChapters.length, 0)
  const cardCount = book.chapters.reduce((acc, ch) =>
    acc + ch.subChapters.reduce((acc2, sc) => acc2 + sc._count.cards, 0), 0)
  return { chapterCount, subChapterCount, cardCount }
}

function getBookIcon(type: string) {
  switch (type) {
    case 'vocabulary':
      return BookOpen
    case 'sentence':
      return PenTool
    case 'corpus':
      return MessageCircle
    default:
      return Layers
  }
}

function getBookDescription(subType: string) {
  switch (subType) {
    case 'spoken':
      return '日常生活场景词汇，口语表达实用库'
    case 'writing_core':
      return '雅思写作核心词汇，数据描述与逻辑连接'
    case 'writing_topic':
      return '写作常考主题词汇，教育科技环境社会'
    case 'reading':
      return '学术阅读词汇，覆盖17个学科领域'
    case 'writing_pattern':
      return '功能类句型，数据描述逻辑论证'
    case 'speaking':
      return '口语话题语料，正式与口语双模式'
    default:
      return ''
  }
}

export default async function HomePage() {
  const books = await getBooks()

  return (
    <div className="content-container py-12">
      {/* 英雄区域 */}
      <section className="mb-16 text-center">
        <div className="relative inline-block mb-6">
          {/* 装饰性光晕 */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-blue-200 blur-3xl opacity-30 rounded-full" />
          {/* 标题 */}
          <h1 className="relative text-5xl md:text-6xl font-bold gradient-text animate-fade-in">
            AthEnglish
          </h1>
          {/* 装饰星星 */}
          <Sparkles className="absolute -top-4 -right-8 h-6 w-6 text-amber-400 animate-float" />
          <Star className="absolute top-0 -left-6 h-4 w-4 text-amber-400 animate-float" style={{ animationDelay: '0.5s' }} />
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 animate-slide-up">
          沉浸式语言学习平台 · 源自雅典智慧
        </p>

        <p className="text-muted-foreground max-w-xl mx-auto animate-slide-up stagger-1">
          探索古希腊智慧与现代英语学习的完美融合，
          通过词汇、句型、语料三大模块，开启你的语言精进之旅。
        </p>

        {/* 装饰分隔线 */}
        <div className="greek-divider mt-8 max-w-md mx-auto" />
      </section>

      {/* 学习模块 */}
      <section>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px bg-gradient-to-r from-transparent to-primary/30 w-16" />
          <h2 className="text-2xl font-semibold title-decoration">选择你的学习之旅</h2>
          <div className="h-px bg-gradient-to-l from-transparent to-primary/30 w-16" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 词汇栏 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">词汇</h3>
            </div>
            <div>
              {books.filter(b => b.type === 'vocabulary').map((book) => {
                const stats = getBookStats(book)
                return (
                  <Link key={book.id} href={`/books/${encodeURIComponent(book.id)}`}>
                    <Card className="book-card glass-card cursor-pointer hover:shadow-md transition-shadow mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{book.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {getBookDescription(book.subType || '')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{stats.chapterCount} 章</span>
                          <span>{stats.subChapterCount} 节</span>
                          <span>{stats.cardCount} 词</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            {books.filter(b => b.type === 'vocabulary').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无词汇书籍</p>
            )}
          </div>

          {/* 句型栏 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <PenTool className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">句型</h3>
            </div>
            <div>
              {books.filter(b => b.type === 'sentence').map((book) => {
                const stats = getBookStats(book)
                return (
                  <Link key={book.id} href={`/books/${encodeURIComponent(book.id)}`}>
                    <Card className="book-card glass-card cursor-pointer hover:shadow-md transition-shadow mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{book.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {getBookDescription(book.subType || '')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{stats.chapterCount} 章</span>
                          <span>{stats.subChapterCount} 节</span>
                          <span>{stats.cardCount} 句</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            {books.filter(b => b.type === 'sentence').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无句型书籍</p>
            )}
          </div>

          {/* 语料栏 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">语料</h3>
            </div>
            <div>
              {books.filter(b => b.type === 'corpus').map((book) => {
                const stats = getBookStats(book)
                return (
                  <Link key={book.id} href={`/books/${encodeURIComponent(book.id)}`}>
                    <Card className="book-card glass-card cursor-pointer hover:shadow-md transition-shadow mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{book.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {getBookDescription(book.subType || '')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{stats.chapterCount} 章</span>
                          <span>{stats.subChapterCount} 节</span>
                          <span>{stats.cardCount} 语料</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            {books.filter(b => b.type === 'corpus').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无语料书籍</p>
            )}
          </div>
        </div>
      </section>

      {/* 底部装饰 */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <div className="greek-divider max-w-xs mx-auto mb-6" />
        <p className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          智慧源于探索 · 雅典英语伴你同行
          <Sparkles className="h-4 w-4 text-amber-400" />
        </p>
      </footer>
    </div>
  )
}
