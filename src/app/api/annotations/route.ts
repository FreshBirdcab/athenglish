import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { cardId, startOffset, endOffset, highlight, note, field } = await request.json()

    // 创建划线批注
    const annotation = await prisma.annotation.create({
      data: {
        userId: (session.user as any).id,
        cardId,
        startOffset,
        endOffset,
        field: field || "primary",
        highlight: highlight || null,
        note: note || null,
      },
    })

    return NextResponse.json({ annotation })
  } catch (error) {
    console.error("创建批注错误:", error)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
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
    await prisma.annotation.delete({
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
