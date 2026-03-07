import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { StudyClient } from "@/components/learn/study-client"

async function getSubChapter(subChapterId: string) {
  const subChapter = await prisma.subChapter.findUnique({
    where: { id: subChapterId },
    include: {
      chapter: {
        include: {
          book: true
        }
      },
      cards: {
        orderBy: { order: 'asc' }
      }
    }
  })
  return subChapter
}

export default async function LearnPage({ params }: { params: Promise<{ subChapterId: string }> }) {
  const { subChapterId } = await params
  const subChapter = await getSubChapter(subChapterId)

  if (!subChapter) {
    notFound()
  }

  const cards = subChapter.cards

  if (cards.length === 0) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <Link href={`/books/${subChapter.chapter.book.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回 {subChapter.chapter.book.name}
          </Link>
          <h1 className="text-2xl font-bold mt-2">{subChapter.name}</h1>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          该章节暂无内容
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href={`/books/${subChapter.chapter.book.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          返回 {subChapter.chapter.book.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{subChapter.name}</h1>
        <p className="text-muted-foreground">{cards.length} 张卡片</p>
      </div>

      <StudyClient cards={cards} subChapterId={subChapterId} />
    </div>
  )
}
