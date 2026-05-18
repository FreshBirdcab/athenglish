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
        description: description === '' ? null : description ?? null,
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

    const bookId = params.id

    // 简单的删除逻辑，利用 Prisma 的级联删除
    await prisma.$transaction(async (tx) => {
      // 1. 确认书籍存在
      const book = await tx.book.findUnique({ where: { id: bookId } })
      if (!book) {
        throw new Error("书籍不存在")
      }

      // 2. 逐个删除关联数据（使用正确的顺序）
      // 先删除卡片相关的数据
      const subChapters = await tx.subChapter.findMany({
        where: { chapter: { bookId } },
        include: { cards: true }
      })

      for (const sc of subChapters) {
        const cardIds = sc.cards.map(c => c.id)
        if (cardIds.length > 0) {
          // 删除卡片相关的用户数据
          await tx.userProgress.deleteMany({ where: { cardId: { in: cardIds } } })
          await tx.userReview.deleteMany({ where: { cardId: { in: cardIds } } })
          await tx.favorite.deleteMany({ where: { cardId: { in: cardIds } } })
          await tx.annotation.deleteMany({ where: { cardId: { in: cardIds } } })
          await tx.fillAnswerHistory.deleteMany({ where: { cardId: { in: cardIds } } })
          // 删除卡片
          await tx.card.deleteMany({ where: { id: { in: cardIds } } })
        }
        // 删除子章节的评论
        await tx.comment.deleteMany({ where: { subChapterId: sc.id } })
      }

      // 删除所有子章节
      await tx.subChapter.deleteMany({
        where: { chapter: { bookId } }
      })

      // 删除所有章节
      await tx.chapter.deleteMany({ where: { bookId } })

      // 删除样式设置
      await tx.bookStyleSettings.deleteMany({ where: { bookId } })

      // 最后删除书籍
      await tx.book.delete({ where: { id: bookId } })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("删除书籍错误:", error)
    return NextResponse.json({ error: "删除失败", details: error?.message }, { status: 500 })
  }
}
