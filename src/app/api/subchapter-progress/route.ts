import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: 获取所有小节的学习进度
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      // 未登录时返回空进度
      return NextResponse.json({ progress: {} })
    }

    const userId = (session.user as any).id

    // 获取所有卡片和对应的 subChapterId
    const cards = await prisma.card.findMany({
      select: {
        id: true,
        subChapterId: true,
      },
    })

    // 获取用户的所有填空答题历史
    const fillHistories = await prisma.fillAnswerHistory.findMany({
      where: { userId },
      select: { cardId: true },
    })

    // 创建已完成的卡片ID集合
    const completedCardIds = new Set(fillHistories.map(h => h.cardId))

    // 按 subChapterId 分组统计
    const progressMap: Record<string, { total: number; completed: number }> = {}

    cards.forEach(card => {
      if (!progressMap[card.subChapterId]) {
        progressMap[card.subChapterId] = { total: 0, completed: 0 }
      }
      progressMap[card.subChapterId].total += 1
      if (completedCardIds.has(card.id)) {
        progressMap[card.subChapterId].completed += 1
      }
    })

    return NextResponse.json({ progress: progressMap })
  } catch (error) {
    console.error("获取小节进度错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
