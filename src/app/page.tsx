import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { Sparkles, Star } from "lucide-react"

// 古希腊风格图标组件
function OwlIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      {/* 头部 */}
      <ellipse cx="50" cy="35" rx="25" ry="22" fill="currentColor" className="text-amber-600" />
      {/* 面部浅色区域 */}
      <ellipse cx="50" cy="40" rx="18" ry="15" fill="currentColor" className="text-amber-100" />
      {/* 眼睛 */}
      <circle cx="42" cy="38" r="6" fill="#1f2937" />
      <circle cx="58" cy="38" r="6" fill="#1f2937" />
      <circle cx="43" cy="36" r="2" fill="white" />
      <circle cx="59" cy="36" r="2" fill="white" />
      {/* 喙 */}
      <polygon points="50,42 47,48 53,48" fill="currentColor" className="text-amber-600" />
      {/* 身体 */}
      <ellipse cx="50" cy="70" rx="28" ry="22" fill="currentColor" className="text-amber-600" />
      <ellipse cx="50" cy="72" rx="22" ry="16" fill="currentColor" className="text-amber-100" />
      {/* 橄榄枝 */}
      <path d="M15 55 Q20 50 25 55 Q30 60 35 55" stroke="currentColor" strokeWidth="2" fill="none" className="text-green-600" />
      <ellipse cx="18" cy="53" rx="3" ry="2" fill="currentColor" className="text-green-600" />
      <ellipse cx="28" cy="58" rx="3" ry="2" fill="currentColor" className="text-green-600" />
      <ellipse cx="35" cy="54" rx="3" ry="2" fill="currentColor" className="text-green-600" />
    </svg>
  )
}

function VocabularyIcon({ className }: { className?: string }) {
  return <OwlIcon className={className} />
}

function SentenceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      {/* 卷轴/书卷 */}
      <rect x="20" y="30" width="60" height="40" rx="4" fill="currentColor" className="text-amber-600" />
      <rect x="25" y="35" width="50" height="30" rx="2" fill="currentColor" className="text-amber-100" />
      {/* 左边卷轴轴 */}
      <rect x="15" y="25" width="8" height="50" rx="2" fill="currentColor" className="text-amber-700" />
      <circle cx="19" cy="25" r="4" fill="currentColor" className="text-amber-700" />
      <circle cx="19" cy="75" r="4" fill="currentColor" className="text-amber-700" />
      {/* 右边卷轴轴 */}
      <rect x="77" y="25" width="8" height="50" rx="2" fill="currentColor" className="text-amber-700" />
      <circle cx="81" cy="25" r="4" fill="currentColor" className="text-amber-700" />
      <circle cx="81" cy="75" r="4" fill="currentColor" className="text-amber-700" />
      {/* 文字线条 */}
      <line x1="30" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="2" className="text-amber-300" />
      <line x1="30" y1="52" x2="55" y2="52" stroke="currentColor" strokeWidth="2" className="text-amber-300" />
      <line x1="30" y1="59" x2="45" y2="59" stroke="currentColor" strokeWidth="2" className="text-amber-300" />
    </svg>
  )
}

function CorpusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      {/* 对话气泡 */}
      <path d="M20 70 L20 30 L50 30 L50 25 L20 25 L20 20 Q20 15 25 15 L75 15 Q80 15 80 20 L80 65 Q80 70 75 70 L30 70 L25 80 L25 70 Z" fill="currentColor" className="text-blue-500" />
      {/* 对话内容 */}
      <circle cx="35" cy="30" r="4" fill="white" />
      <circle cx="50" cy="30" r="4" fill="white" />
      <circle cx="65" cy="30" r="4" fill="white" />
      <rect x="30" y="40" width="40" height="3" rx="1" fill="white" className="opacity-70" />
      <rect x="30" y="48" width="30" height="3" rx="1" fill="white" className="opacity-70" />
    </svg>
  )
}

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
      return VocabularyIcon
    case 'sentence':
      return SentenceIcon
    case 'corpus':
      return CorpusIcon
    default:
      return OwlIcon
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book, index) => {
            const Icon = getBookIcon(book.type)
            const stats = getBookStats(book)
            return (
              <Link key={book.id} href={`/books/${encodeURIComponent(book.id)}`}>
                <Card className={`book-card glass-card cursor-pointer h-full animate-scale-in stagger-${index + 1}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-8 w-8" />
                      </div>
                      <Badge variant="secondary" className="badge-greek">
                        {book.type === 'vocabulary' && '词汇'}
                        {book.type === 'sentence' && '句型'}
                        {book.type === 'corpus' && '语料'}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg">{book.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {getBookDescription(book.subType || '')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        {stats.chapterCount} 章节
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                        {stats.subChapterCount} 小节
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                        {stats.cardCount} 卡片
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
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
