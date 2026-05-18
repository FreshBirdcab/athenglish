import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ExportContent } from "@/components/export/export-content"

export const dynamic = "force-dynamic"

async function getExportData(subChapterId: string) {
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

export default async function ExportPage({ params }: { params: { subChapterId: string } }) {
  const subChapterId = decodeURIComponent(params.subChapterId)
  const subChapter = await getExportData(subChapterId)

  if (!subChapter) {
    notFound()
  }

  const cards = subChapter.cards.map(card => ({
    id: card.id,
    contentPrimary: card.contentPrimary,
    contentSecondary: card.contentSecondary,
    usageNote: card.usageNote,
    exampleEn: card.exampleEn,
    exampleZh: card.exampleZh,
    analysis: card.analysis,
  }))

  // 服务端获取当前用户的批注
  let annotations: Record<string, any[]> = {}
  try {
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const cardIds = cards.map(c => c.id)
      const userId = (session.user as any).id
      if (userId) {
        const dbAnnotations = await prisma.annotation.findMany({
          where: {
            userId,
            cardId: { in: cardIds }
          },
          orderBy: { createdAt: "asc" }
        })
        // 按 cardId 分组
        for (const ann of dbAnnotations) {
          if (!annotations[ann.cardId]) annotations[ann.cardId] = []
          annotations[ann.cardId].push({
            id: ann.id,
            startOffset: ann.startOffset,
            endOffset: ann.endOffset,
            highlight: ann.highlight,
            note: ann.note,
            field: ann.field,
          })
        }
      }
    }
  } catch (error) {
    console.error("获取批注错误:", error)
  }

  const subChapterInfo = {
    name: subChapter.name,
    chapterName: subChapter.chapter.name,
    bookName: subChapter.chapter.book.name,
    bookType: subChapter.chapter.book.type,
    cardCount: cards.length,
  }

  return (
    <ExportContent
      cards={cards}
      subChapter={subChapterInfo}
      annotations={annotations}
    />
  )
}
