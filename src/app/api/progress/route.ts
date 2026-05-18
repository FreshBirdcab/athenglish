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

    const { cardId, status, learningTime } = await request.json()

    if (!cardId) {
      return NextResponse.json({ error: "缺少卡片ID" }, { status: 400 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
    }

    // 确保 status 有默认值
    const progressStatus = status || "learning"

    // 更新或创建学习进度
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_cardId: {
          userId: (session.user as any).id,
          cardId,
        },
      },
      update: {
        status: progressStatus,
        lastReviewedAt: new Date(),
        learningTime: learningTime ? { increment: learningTime } : undefined,
      },
      create: {
        userId: (session.user as any).id,
        cardId,
        status: progressStatus,
        learningTime: learningTime || 0,
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

    const [totalCards, userProgress, streak, recentProgress] = await Promise.all([
      prisma.card.count(),
      prisma.userProgress.findMany({ where: { userId } }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.userProgress.findMany({
        where: {
          userId,
          learnedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    // 标记过的卡片即视为已学习（状态非 new）
    const learnedCards = userProgress.filter(p => p.status !== "new").length

    // 统计每天的学习数量
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = recentProgress.filter(p => {
        const pDate = new Date(p.learnedAt)
        return pDate >= date && pDate < nextDate
      }).length

      return {
        date: date.toLocaleDateString("zh-CN", { weekday: "short" }),
        count
      }
    })

    return NextResponse.json({
      totalCards,
      learnedCards,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      dailyStats
    })
  } catch (error) {
    console.error("获取进度错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
