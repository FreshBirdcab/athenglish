import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const { id } = await params

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        subChapter: {
          include: {
            chapter: {
              include: {
                book: true
              }
            }
          }
        }
      }
    })

    if (!card) {
      return NextResponse.json({ error: "卡片不存在" }, { status: 404 })
    }

    return NextResponse.json({ card })
  } catch (error) {
    console.error("获取卡片失败:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

