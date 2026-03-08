import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取单个书籍
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        chapters: {
          include: {
            subChapters: {
              include: {
                cards: {
                  select: { id: true },
                  take: 1
                }
              }
            }
          }
        },
        styleSettings: true
      }
    })

    if (!book) {
      return NextResponse.json({ error: "书籍不存在" }, { status: 404 })
    }

    // 计算卡片总数
    let totalCards = 0
    for (const chapter of book.chapters) {
      for (const subChapter of chapter.subChapters) {
        const count = await prisma.card.count({
          where: { subChapterId: subChapter.id }
        })
        totalCards += count
      }
    }

    return NextResponse.json({
      book: {
        ...book,
        totalCards
      }
    })
  } catch (error) {
    console.error("获取书籍错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

// 更新书籍信息
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { name, description, cover, order } = await request.json()

    const book = await prisma.book.update({
      where: { id: params.id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        cover: cover ?? undefined,
        order: order ?? undefined,
      }
    })

    return NextResponse.json({ success: true, book })
  } catch (error) {
    console.error("更新书籍错误:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

// 删除书籍
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    // 删除书籍（级联删除章节、子章节、卡片、样式设置）
    await prisma.book.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除书籍错误:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
