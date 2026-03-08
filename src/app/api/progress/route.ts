import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { cardId, status } = await request.json()

    // 更新或创建学习进度
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_cardId: {
          userId: (session.user as any).id,
          cardId,
        },
      },
      update: {
        status,
        lastReviewedAt: new Date(),
      },
      create: {
        userId: (session.user as any).id,
        cardId,
        status,
      },
    })

    // 更新连续打卡
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const streak = await prisma.streak.findUnique({
      where: { userId: (session.user as any).id },
    })

    if (streak) {
      const lastActive = streak.lastActiveDate
      let newStreak = streak.currentStreak

      if (lastActive) {
        const lastActiveDay = new Date(lastActive)
        lastActiveDay.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          newStreak += 1
        } else if (diffDays > 1) {
          newStreak = 1
        }
      } else {
        newStreak = 1
      }

      await prisma.streak.update({
        where: { userId: (session.user as any).id },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActiveDate: today,
        },
      })
    }

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error("进度更新错误:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    // 获取学习统计数据
    const userId = (session.user as any).id

    const [totalCards, learnedCards, streak] = await Promise.all([
      prisma.card.count(),
      prisma.userProgress.count({
        where: { userId, status: { in: ["learning", "mastered"] } },
      }),
      prisma.streak.findUnique({
        where: { userId },
      }),
    ])

    return NextResponse.json({
      totalCards,
      learnedCards,
      streak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
    })
  } catch (error) {
    console.error("获取进度错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
