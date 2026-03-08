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

  // 按类型分组
  const vocabularyBooks = books.filter(b => b.type === 'vocabulary')
  const sentenceBooks = books.filter(b => b.type === 'sentence')
  const corpusBooks = books.filter(b => b.type === 'corpus')

  const BookColumn = ({ title, icon: Icon, books, type }: { title: string; icon: any; books: typeof books; type: string }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="secondary">{books.length}</Badge>
      </div>
      {books.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            暂无{title}
          </CardContent>
        </Card>
      ) : (
        <div>
          {books.map((book) => {
            const stats = getBookStats(book)
            return (
              <Link key={book.id} href={`/books/${encodeURIComponent(book.id)}`}>
                <Card className="book-card glass-card cursor-pointer hover:shadow-md transition-shadow mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{book.name}</CardTitle>
                    <CardDescription className="text-xs">{getBookDescription(book.subType || '')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-xs text-muted-foreground">
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
      )}
    </div>
  )

  return (
    <div className="content-container py-8">
      <h1 className="text-3xl font-bold mb-8">全部书籍</h1>

      <div className="space-y-8">
        <BookColumn title="词汇" icon={BookOpen} books={vocabularyBooks} type="vocabulary" />
        <BookColumn title="句型" icon={PenTool} books={sentenceBooks} type="sentence" />
        <BookColumn title="语料" icon={MessageCircle} books={corpusBooks} type="corpus" />
      </div>
    </div>
  )
}
