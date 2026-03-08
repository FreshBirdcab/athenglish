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

    const { cardId, type = "word" } = await request.json()

    // 检查是否已收藏
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_cardId_type: {
          userId: (session.user as any).id,
          cardId,
          type,
        },
      },
    })

    if (existing) {
      // 取消收藏
      await prisma.favorite.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ favorited: false })
    } else {
      // 添加收藏
      await prisma.favorite.create({
        data: {
          userId: (session.user as any).id,
          cardId,
          type,
        },
      })
      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error("收藏操作错误:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: (session.user as any).id },
      include: {
        card: {
          include: {
            subChapter: {
              include: {
                chapter: {
                  include: { book: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error("获取收藏错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}
