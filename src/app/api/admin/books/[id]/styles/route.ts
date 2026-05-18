import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 获取书籍字段样式
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
      include: { styleSettings: true }
    })

    if (!book) {
      return NextResponse.json({ error: "书籍不存在" }, { status: 404 })
    }

    // 如果没有样式设置，创建默认样式
    let styles = book.styleSettings?.fieldStyles
    if (!styles) {
      const defaultStyles = getDefaultFieldStyles(book.type)
      await prisma.bookStyleSettings.create({
        data: {
          bookId: book.id,
          fieldStyles: JSON.stringify(defaultStyles)
        }
      })
      styles = JSON.stringify(defaultStyles)
    }

    // 获取列名
    let columnNames: string[] | null = null
    if (book.styleSettings?.columnNames) {
      try {
        columnNames = JSON.parse(book.styleSettings.columnNames)
      } catch (e) {
        columnNames = null
      }
    }

    return NextResponse.json({ styles: JSON.parse(styles!), columnNames })
  } catch (error) {
    console.error("获取样式错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

// 保存书籍字段样式
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { fieldStyles, columnNames } = await request.json()

    if (!fieldStyles) {
      return NextResponse.json({ error: "样式不能为空" }, { status: 400 })
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id }
    })

    if (!book) {
      return NextResponse.json({ error: "书籍不存在" }, { status: 404 })
    }

    // 更新或创建样式设置
    // 解析列名
    let parsedColumnNames: string[] | null = null
    if (columnNames && Array.isArray(columnNames)) {
      parsedColumnNames = columnNames.filter((s: string) => s && s.trim())
    }

    const settings = await prisma.bookStyleSettings.upsert({
      where: { bookId: params.id },
      update: {
        fieldStyles: JSON.stringify(fieldStyles),
        columnNames: parsedColumnNames ? JSON.stringify(parsedColumnNames) : null
      },
      create: {
        bookId: params.id,
        fieldStyles: JSON.stringify(fieldStyles),
        columnNames: parsedColumnNames ? JSON.stringify(parsedColumnNames) : null
      }
    })

    return NextResponse.json({ success: true, styles: fieldStyles })
  } catch (error) {
    console.error("保存样式错误:", error)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}

function getDefaultFieldStyles(bookType: string) {
  if (bookType === 'corpus') {
    return {
      primary: { fontSize: 'text-xl', fontWeight: 'font-bold', color: 'text-primary', bold: true, italic: false },
      secondary: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      usageNote: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      exampleEn: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      exampleZh: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      analysis: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: true }
    }
  }
  // vocabulary 和 sentence
  return {
    primary: { fontSize: 'text-3xl', fontWeight: 'font-bold', color: 'text-primary', bold: true, italic: false },
    secondary: { fontSize: 'text-xl', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
    usageNote: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
    exampleEn: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
    exampleZh: { fontSize: 'text-sm', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false }
  }
}
