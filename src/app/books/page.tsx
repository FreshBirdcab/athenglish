import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { BookOpen, MessageCircle, PenTool, Layers, ChevronRight } from "lucide-react"

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

export default async function BooksPage() {
  const books = await getBooks()

  // 按类型分组
  const vocabularyBooks = books.filter(b => b.type === 'vocabulary')
  const sentenceBooks = books.filter(b => b.type === 'sentence')
  const corpusBooks = books.filter(b => b.type === 'corpus')

  const totalBooks = books.length
  const totalChapters = books.reduce((acc, b) => acc + b.chapters.length, 0)
  const totalSubChapters = books.reduce((acc, b) => acc + b.chapters.reduce((sum, ch) => sum + ch.subChapters.length, 0), 0)
  const totalCards = books.reduce((acc, b) => acc + b.chapters.reduce((sum, ch) => sum + ch.subChapters.reduce((s, sc) => s + sc._count.cards, 0), 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部区域 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-accent py-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4 -rotate-90" />
            返回首页
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            全部书籍
          </h1>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span>{totalBooks} 本书籍</span>
            <span>{totalChapters} 个章节</span>
            <span>{totalSubChapters} 个小节</span>
            <span>{totalCards} 张卡片</span>
          </div>
        </div>
      </div>

      {/* 书籍列表 */}
      <div className="container mx-auto px-4 py-8 -mt-3">
        {/* 词汇栏 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">词汇</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {vocabularyBooks.length} 本
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vocabularyBooks.map((book, index) => {
              const stats = getBookStats(book)
              return (
                <Link
                  key={book.id}
                  href={`/books/${encodeURIComponent(book.id)}`}
                  style={{
                    animation: `fadeSlideIn 0.4s ease-out forwards`,
                    animationDelay: `${index * 0.08}s`,
                    opacity: 0
                  }}
                >
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 bg-card/80 h-full">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold line-clamp-2 flex-1">
                          {book.name}
                        </CardTitle>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <CardDescription className="text-xs mt-2">
                        {getBookDescription(book.subType || '')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
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
            {vocabularyBooks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">暂无词汇书籍</p>
            )}
          </div>
        </div>

        {/* 句型栏 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <PenTool className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">句型</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {sentenceBooks.length} 本
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sentenceBooks.map((book, index) => {
              const stats = getBookStats(book)
              const vocabCount = vocabularyBooks.length
              return (
                <Link
                  key={book.id}
                  href={`/books/${encodeURIComponent(book.id)}`}
                  style={{
                    animation: `fadeSlideIn 0.4s ease-out forwards`,
                    animationDelay: `${(index + vocabCount) * 0.08}s`,
                    opacity: 0
                  }}
                >
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 bg-card/80 h-full">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold line-clamp-2 flex-1">
                          {book.name}
                        </CardTitle>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <CardDescription className="text-xs mt-2">
                        {getBookDescription(book.subType || '')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
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
            {sentenceBooks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">暂无句型书籍</p>
            )}
          </div>
        </div>

        {/* 语料栏 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">语料</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {corpusBooks.length} 本
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {corpusBooks.map((book, index) => {
              const stats = getBookStats(book)
              const vocabCount = vocabularyBooks.length
              const sentenceCount = sentenceBooks.length
              return (
                <Link
                  key={book.id}
                  href={`/books/${encodeURIComponent(book.id)}`}
                  style={{
                    animation: `fadeSlideIn 0.4s ease-out forwards`,
                    animationDelay: `${(index + vocabCount + sentenceCount) * 0.08}s`,
                    opacity: 0
                  }}
                >
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 bg-card/80 h-full">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold line-clamp-2 flex-1">
                          {book.name}
                        </CardTitle>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                      <CardDescription className="text-xs mt-2">
                        {getBookDescription(book.subType || '')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
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
            {corpusBooks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 col-span-full">暂无语料书籍</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
