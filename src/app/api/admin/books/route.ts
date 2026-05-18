import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"

// 书本配置映射
const BOOK_CONFIG: Record<string, { name: string; type: string; subType: string }> = {
  '001口语词汇-全场景': { name: '口语词汇-全场景', type: 'vocabulary', subType: 'spoken' },
  '001写作词汇-核心': { name: '写作词汇-核心', type: 'vocabulary', subType: 'writing_core' },
  '001写作词汇-主题': { name: '写作词汇-主题', type: 'vocabulary', subType: 'writing_topic' },
  '001阅读词汇': { name: '阅读词汇', type: 'vocabulary', subType: 'reading' },
  '002写作句型-功能类': { name: '写作句型-功能类', type: 'sentence', subType: 'writing_pattern' },
  '003口语语料': { name: '口语语料', type: 'corpus', subType: 'speaking' },
}

const MATERIALS_DIR = path.join(process.cwd(), 'xlsx_materials')

// 获取所有书籍
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const books = await prisma.book.findMany({
      include: {
        chapters: {
          include: {
            subChapters: {
              include: {
                _count: {
                  select: { cards: true }
                }
              }
            }
          }
        },
        styleSettings: true
      },
      orderBy: { order: 'asc' }
    })

    // 计算每本书的卡片总数
    const booksWithCount = books.map(book => {
      let totalCards = 0
      book.chapters.forEach(chapter => {
        chapter.subChapters.forEach(subChapter => {
          totalCards += subChapter._count.cards
        })
      })
      return {
        ...book,
        totalCards,
        chapterCount: book.chapters.length,
        subChapterCount: book.chapters.reduce((acc, ch) => acc + ch.subChapters.length, 0)
      }
    })

    return NextResponse.json({ books: booksWithCount })
  } catch (error) {
    console.error("获取书籍错误:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

// 创建新书籍
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const { bookDir } = await request.json()

    if (!bookDir) {
      return NextResponse.json({ error: "请选择书籍目录" }, { status: 400 })
    }

    const bookPath = path.join(MATERIALS_DIR, bookDir)
    if (!fs.existsSync(bookPath)) {
      return NextResponse.json({ error: "书籍目录不存在" }, { status: 400 })
    }

    const config = BOOK_CONFIG[bookDir]
    if (!config) {
      return NextResponse.json({ error: "不支持的书籍类型" }, { status: 400 })
    }

    // 检查书籍是否已存在
    let book = await prisma.book.findUnique({
      where: { id: bookDir }
    })

    if (book) {
      // 书籍已存在，删除旧数据重新导入
      await prisma.book.delete({
        where: { id: bookDir }
      })
    }

    // 创建书本
    book = await prisma.book.create({
      data: {
        id: bookDir,
        name: config.name,
        type: config.type,
        subType: config.subType,
      },
    })

    // 创建默认样式设置
    const defaultStyles = getDefaultFieldStyles(config.type)
    await prisma.bookStyleSettings.create({
      data: {
        bookId: book.id,
        fieldStyles: JSON.stringify(defaultStyles)
      }
    })

    // 导入章节和卡片
    await importBookData(bookPath, book.id, config.subType)

    return NextResponse.json({ success: true, book })
  } catch (error) {
    console.error("创建书籍错误:", error)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
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

async function parseExcelFile(filePath: string, bookSubType: string) {
  // 读取文件为 buffer，避免中文字符路径问题
  const fileBuffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

  if (data.length < 1) return []

  return data.map((row, index) => {
    if (bookSubType === 'speaking') {
      return {
        uuid: uuidv4(),
        contentPrimary: row[0] || '',
        contentSecondary: row[1] || '',
        usageNote: row[2] || '',
        exampleEn: row[3] || '',
        exampleZh: row[4] || '',
        analysis: row[5] || '',
        order: index,
      }
    } else {
      return {
        uuid: uuidv4(),
        contentPrimary: row[0] || '',
        contentSecondary: row[1] || '',
        usageNote: row[2] || '',
        exampleEn: row[3] || '',
        exampleZh: row[4] || '',
        analysis: null,
        order: index,
      }
    }
  })
}

async function importBookData(bookPath: string, bookId: string, bookSubType: string) {
  const chapterDirs = fs.readdirSync(bookPath)

  for (const chapterDir of chapterDirs) {
    const chapterPath = path.join(bookPath, chapterDir)
    if (!fs.statSync(chapterPath).isDirectory()) continue

    // 创建章节
    const chapter = await prisma.chapter.create({
      data: {
        id: `${bookId}-ch-${uuidv4()}`,
        bookId: bookId,
        name: chapterDir,
      },
    })

    // 遍历子章节（Excel文件）
    const files = fs.readdirSync(chapterPath).filter(f => f.endsWith('.xlsx'))

    for (const file of files) {
      const filePath = path.join(chapterPath, file)
      const fileName = file.replace('.xlsx', '')
      const relativePath = path.join(bookId, chapterDir, file)

      // 创建子章节
      const subChapter = await prisma.subChapter.create({
        data: {
          id: `${bookId}-sub-${uuidv4()}`,
          chapterId: chapter.id,
          name: fileName,
          filePath: relativePath,
        },
      })

      // 解析 Excel 并创建卡片
      const cards = await parseExcelFile(filePath, bookSubType)

      for (const card of cards) {
        await prisma.card.create({
          data: {
            subChapterId: subChapter.id,
            uuid: card.uuid,
            contentPrimary: card.contentPrimary,
            contentSecondary: card.contentSecondary,
            usageNote: card.usageNote,
            exampleEn: card.exampleEn,
            exampleZh: card.exampleZh,
            analysis: card.analysis,
            order: card.order,
          },
        })
      }
    }
  }
}
