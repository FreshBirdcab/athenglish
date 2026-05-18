import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { BookOpen, MessageCircle, PenTool, Sparkles, ChevronRight } from "lucide-react"
import { revalidatePath } from "next/cache"
import GalaxyBackground from "@/components/layout/galaxy-background"
import PianoKeyHero from "@/components/home/piano-key-hero"

async function getBooks() {
  // 每次获取时重新验证，确保获取最新数据
  revalidatePath('/')

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
      return '写作核心词汇，数据描述与逻辑连接'
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
    <div className="min-h-screen bg-background relative">
      {/* 琴音模式发光字母 - 仅暗夜模式 */}
      <PianoKeyHero />
      {/* 顶部区域 - 动态渐变 + 浮动光点 */}
      <div className="relative z-20 overflow-hidden hero-gradient-home py-13.5">
        {/* 浮动光点 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="float-orb w-32 h-32 bg-primary/8 -top-4 -left-8" />
          <div className="float-orb-delayed w-40 h-40 bg-accent/6 top-1/2 -right-12" style={{ animationDelay: '-2s' }} />
          <div className="float-orb w-24 h-24 bg-primary/6 bottom-0 left-1/3" style={{ animationDelay: '-4s' }} />
          <div className="float-orb-delayed w-28 h-28 bg-accent/5 top-1/4 right-1/4" style={{ animationDelay: '-1s' }} />
        </div>

        {/* 装饰光晕 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative content-container flex flex-col justify-center min-h-[150px]">
          <h1 className="text-4xl md:text-5xl font-bold hero-text mb-3 tracking-tight">
            AthEnglish
          </h1>
          <p className="hero-text-muted text-lg">
            让每个字母都找到属于自己的频率
          </p>
        </div>
      </div>

      {/* 银河星空背景 - 暗夜模式 */}
      <GalaxyBackground />

      {/* 学习模块 */}
      <div className="content-container py-8 -mt-6 relative z-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 词汇栏 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">词汇</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {books.filter(b => b.type === 'vocabulary').length} 本
              </span>
            </div>
            <div className="space-y-4">
              {books.filter(b => b.type === 'vocabulary').map((book, index) => {
                const stats = getBookStats(book)
                return (
                  <Link
                    key={book.id}
                    href={`/books/${encodeURIComponent(book.id)}`}
                    className="block"
                  >
                    <Card
                      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 bg-card/80"
                      style={{
                        animation: `fadeSlideIn 0.4s ease-out forwards`,
                        animationDelay: `${index * 0.1}s`,
                        opacity: 0
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                                {book.name}
                              </CardTitle>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                            </div>
                            <CardDescription className="text-xs mt-1">
                              {book.description || getBookDescription(book.subType || '')}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between text-xs text-muted-foreground pl-11">
                          <span>{stats.chapterCount} 章</span>
                          <span>{stats.subChapterCount} 节</span>
                          <span>{stats.cardCount} 词</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
              {books.filter(b => b.type === 'vocabulary').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">暂无词汇书籍</p>
              )}
            </div>
          </div>

          {/* 句型栏 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <PenTool className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">句型</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {books.filter(b => b.type === 'sentence').length} 本
              </span>
            </div>
            <div className="space-y-4">
              {books.filter(b => b.type === 'sentence').map((book, index) => {
                const stats = getBookStats(book)
                const vocabCount = books.filter(b => b.type === 'vocabulary').length
                return (
                  <Link
                    key={book.id}
                    href={`/books/${encodeURIComponent(book.id)}`}
                    className="block"
                  >
                    <Card
                      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 bg-card/80"
                      style={{
                        animation: `fadeSlideIn 0.4s ease-out forwards`,
                        animationDelay: `${(index + vocabCount) * 0.1}s`,
                        opacity: 0
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                                {book.name}
                              </CardTitle>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                            </div>
                            <CardDescription className="text-xs mt-1">
                              {book.description || getBookDescription(book.subType || '')}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between text-xs text-muted-foreground pl-11">
                          <span>{stats.chapterCount} 章</span>
                          <span>{stats.subChapterCount} 节</span>
                          <span>{stats.cardCount} 句</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
              {books.filter(b => b.type === 'sentence').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">暂无句型书籍</p>
              )}
            </div>
          </div>

          {/* 语料栏 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">语料</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {books.filter(b => b.type === 'corpus').length} 本
              </span>
            </div>
            <div className="space-y-4">
              {books.filter(b => b.type === 'corpus').map((book, index) => {
                const stats = getBookStats(book)
                const vocabCount = books.filter(b => b.type === 'vocabulary').length
                const sentenceCount = books.filter(b => b.type === 'sentence').length
                return (
                  <Link
                    key={book.id}
                    href={`/books/${encodeURIComponent(book.id)}`}
                    className="block"
                  >
                    <Card
                      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 bg-card/80"
                      style={{
                        animation: `fadeSlideIn 0.4s ease-out forwards`,
                        animationDelay: `${(index + vocabCount + sentenceCount) * 0.1}s`,
                        opacity: 0
                      }}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                                {book.name}
                              </CardTitle>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                            </div>
                            <CardDescription className="text-xs mt-1">
                              {book.description || getBookDescription(book.subType || '')}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between text-xs text-muted-foreground pl-11">
                          <span>{stats.chapterCount} 章</span>
                          <span>{stats.subChapterCount} 节</span>
                          <span>{stats.cardCount} 语料</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
              {books.filter(b => b.type === 'corpus').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">暂无语料书籍</p>
              )}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-primary/40" />
            <span>每个单词都属于它的位置 · 伴你英语精进之路</span>
            <Sparkles className="w-3 h-3 text-primary/40" />
          </div>
        </footer>
      </div>
    </div>
  )
}
