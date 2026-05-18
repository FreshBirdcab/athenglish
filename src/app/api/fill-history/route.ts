import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: 保存或更新答题历史
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { cardId, correctCount, incorrectCount } = await request.json()
    const userId = (session.user as any).id

    // 更新或创建答题历史
    const history = await prisma.fillAnswerHistory.upsert({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
      update: {
        correctCount,
        incorrectCount,
      },
      create: {
        userId,
        cardId,
        correctCount,
        incorrectCount,
      },
    })

    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error("保存答题历史错误:", error)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}

// GET: 获取所有答题历史
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const userId = (session.user as any).id

    const histories = await prisma.fillAnswerHistory.findMany({
      where: { userId },
    })

    // 转换为 Record<string, { correct: number, incorrect: number }> 格式
    const historyMap: Record<string, { correct: number; incorrect: number }> = {}
    histories.forEach(h => {
      historyMap[h.cardId] = {
        correct: h.correctCount,
        incorrect: h.incorrectCount,
      }
    })

    return NextResponse.json({ histories: historyMap })
  } catch (error) {
    console.error("获取答题历史错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
