import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ChevronLeft } from "lucide-react"
import { StudyModeWrapper } from "@/components/learn/study-mode-wrapper"

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

export default async function LearnPage({ params }: { params: { subChapterId: string } }) {
  const subChapterId = decodeURIComponent(params.subChapterId)
  const subChapter = await getSubChapter(subChapterId)

  if (!subChapter) {
    notFound()
  }

  const cards = subChapter.cards

  if (cards.length === 0) {
    return (
      <div className="content-container py-8">
        <div className="mb-6 glass-card rounded-xl p-4">
          <Link href={`/books/${subChapter.chapter.book.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            返回 {subChapter.chapter.book.name}
          </Link>
          <h1 className="text-2xl font-bold mt-2">{subChapter.name}</h1>
        </div>
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          该章节暂无内容
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-8">
      <div className="mb-6 glass-card rounded-xl p-4">
        <Link href={`/books/${subChapter.chapter.book.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          返回 {subChapter.chapter.book.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{subChapter.name}</h1>
        <p className="text-muted-foreground">{cards.length} 张卡片</p>
      </div>

      <StudyModeWrapper
        cards={cards}
        subChapterId={subChapterId}
        bookType={subChapter.chapter.book.type}
        bookSubType={subChapter.chapter.book.subType}
      />
    </div>
  )
}
