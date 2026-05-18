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

    const { cardId, startOffset, endOffset, highlight, note, field } = await request.json()

    const userId = (session.user as any).id

    if (!userId) {
      return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    if (!cardId) {
      return NextResponse.json({ error: "缺少 cardId" }, { status: 400 })
    }

    // 验证卡片是否存在
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true }
    })

    if (!card) {
      return NextResponse.json({ error: "卡片不存在，请刷新页面后重试" }, { status: 400 })
    }

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在，请重新登录" }, { status: 401 })
    }

    // 创建划线批注
    const annotation = await prisma.annotation.create({
      data: {
        userId,
        cardId,
        startOffset,
        endOffset,
        field: field || "primary",
        highlight: highlight || null,
        note: note || null,
      },
    })

    return NextResponse.json({ annotation })
  } catch (error: any) {
    console.error("创建批注错误:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json({ error: "创建失败", details: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get("cardId")

    const where: any = {
      userId: (session.user as any).id,
    }

    if (cardId) {
      where.cardId = cardId
    }

    const annotations = await prisma.annotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ annotations })
  } catch (error) {
    console.error("获取批注错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { id, highlight, note } = await request.json()

    // 更新批注
    const annotation = await prisma.annotation.update({
      where: {
        id,
        userId: (session.user as any).id,
      },
      data: {
        highlight,
        note,
      },
    })

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error("更新批注错误:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少批注ID" }, { status: 400 })
    }

    const body = await request.json()

    // 更新批注
    const annotation = await prisma.annotation.update({
      where: {
        id,
        userId: (session.user as any).id,
      },
      data: {
        highlight: body.highlight !== undefined ? body.highlight : undefined,
        note: body.note !== undefined ? body.note : undefined,
      },
    })

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error("更新批注错误:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少批注ID" }, { status: 400 })
    }

    // 删除批注
    await prisma.annotation.deleteMany({
      where: {
        id,
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除批注错误:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
