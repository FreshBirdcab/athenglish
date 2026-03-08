import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Flame, Target, BookOpen } from "lucide-react"

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userId = (session.user as any).id

  // 获取统计数据
  const [totalCards, userProgress, streak] = await Promise.all([
    prisma.card.count(),
    prisma.userProgress.findMany({
      where: { userId },
    }),
    prisma.streak.findUnique({
      where: { userId },
    }),
  ])

  const learnedCards = userProgress.filter(p => p.status !== "new").length
  const masteredCards = userProgress.filter(p => p.status === "mastered").length

  const progressPercent = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0

  // 获取最近7天的学习记录
  const recentProgress = await prisma.userProgress.findMany({
    where: {
      userId,
      learnedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { learnedAt: "desc" },
  })

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
      count,
    }
  })

  return (
    <div className="content-container py-8">
      <h1 className="text-3xl font-bold mb-8">学习进度</h1>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">连续学习</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak?.currentStreak || 0} 天</div>
            <p className="text-xs text-muted-foreground">最长 {streak?.longestStreak || 0} 天</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已学习</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnedCards} / {totalCards}</div>
            <p className="text-xs text-muted-foreground">掌握 {masteredCards} 张</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">学习进度</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <Progress value={progressPercent} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* 最近7天学习情况 */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>最近7天学习</CardTitle>
          <CardDescription>每日学习卡片数量</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end h-32 gap-2">
            {dailyStats.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary rounded-t"
                  style={{ height: `${Math.max(4, day.count * 4)}px` }}
                />
                <span className="text-xs text-muted-foreground">{day.date}</span>
                <span className="text-xs font-medium">{day.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
