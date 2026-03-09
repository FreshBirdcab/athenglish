import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ChevronLeft, BookOpen } from "lucide-react"
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

// 获取书籍字段样式
async function getBookFieldStyles(bookId: string) {
  const settings = await prisma.bookStyleSettings.findUnique({
    where: { bookId }
  })
  return settings?.fieldStyles ? JSON.parse(settings.fieldStyles) : null
}

export default async function LearnPage({ params }: { params: { subChapterId: string } }) {
  const subChapterId = decodeURIComponent(params.subChapterId)
  const subChapter = await getSubChapter(subChapterId)

  if (!subChapter) {
    notFound()
  }

  const cards = subChapter.cards

  // 获取书籍字段样式
  const fieldStyles = await getBookFieldStyles(subChapter.chapter.book.id)

  if (cards.length === 0) {
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
              href={`/books/${subChapter.chapter.book.id}`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              返回书籍页
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {subChapter.name}
            </h1>
            <p className="text-white/70">
              {subChapter.chapter.book.name}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 -mt-3">
          <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
            该章节暂无内容
          </div>
        </div>
      </div>
    )
  }

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
            href={`/books/${subChapter.chapter.book.id}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            返回书籍页
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                {subChapter.name}
              </h1>
              <p className="text-white/70 text-sm">
                {subChapter.chapter.book.name} · {cards.length} 张卡片
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 学习内容 */}
      <div className="container mx-auto px-4 py-6 -mt-3">
        <StudyModeWrapper
          cards={cards}
          subChapterId={subChapterId}
          bookType={subChapter.chapter.book.type}
          bookSubType={subChapter.chapter.book.subType}
          fieldStyles={fieldStyles}
        />
      </div>
    </div>
  )
}
