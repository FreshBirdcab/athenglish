import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { BookOpen, Layers, MessageCircle, PenTool } from "lucide-react"

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

export default async function BooksPage() {
  const books = await getBooks()

  return (
    <div className="content-container py-8">
      <h1 className="text-3xl font-bold mb-8">全部书籍</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          const Icon = getBookIcon(book.type)
          const stats = getBookStats(book)
          return (
            <Link key={book.id} href={`/books/${encodeURIComponent(book.id)}`}>
              <Card className="book-card glass-card cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">
                      {book.type === 'vocabulary' && '词汇'}
                      {book.type === 'sentence' && '句型'}
                      {book.type === 'corpus' && '语料'}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{book.name}</CardTitle>
                  <CardDescription>{getBookDescription(book.subType || '')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>章节: {stats.chapterCount}</span>
                    <span>小节: {stats.subChapterCount}</span>
                    <span>卡片: {stats.cardCount}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
