import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { ChevronRight } from "lucide-react"

async function getBook(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          subChapters: {
            orderBy: { order: 'asc' },
            include: {
              _count: {
                select: { cards: true }
              }
            }
          }
        }
      }
    }
  })
  return book
}

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params
  const book = await getBook(bookId)

  if (!book) {
    notFound()
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold mt-2">{book.name}</h1>
        <p className="text-muted-foreground mt-1">
          {book.chapters.length} 个章节，{' '}
          {book.chapters.reduce((acc, ch) => acc + ch.subChapters.length, 0)} 个小节
        </p>
      </div>

      <div className="space-y-6">
        {book.chapters.map((chapter) => (
          <div key={chapter.id}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              {chapter.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {chapter.subChapters.map((subChapter) => (
                <Link key={subChapter.id} href={`/learn/${subChapter.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          </div>
        ))}
      </div>
    </div>
  )
}
