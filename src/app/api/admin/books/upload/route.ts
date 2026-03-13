import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import os from "os"
import { execSync } from "child_process"

// 上传并解析书籍文件
export async function POST(request: Request) {
  let tempDir = null

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "无权限" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bookName = formData.get('bookName') as string
    const bookType = formData.get('bookType') as string
    const columnNames = formData.get('columnNames') as string

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 })
    }

    if (!bookName) {
      return NextResponse.json({ error: "请输入书籍名称" }, { status: 400 })
    }

    // 创建临时目录
    tempDir = path.join(os.tmpdir(), `book-import-${uuidv4()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    // 保存上传的文件
    const filePath = path.join(tempDir, file.name)
    const buffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(buffer))

    let sourceDir = tempDir

    // 如果是 ZIP 文件，解压
    if (file.name.endsWith('.zip')) {
      const extractDir = path.join(tempDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })

      try {
        // 使用 PowerShell 解压
        execSync(`powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${extractDir}' -Force"`, { encoding: 'utf-8', stdio: 'pipe' })

        // 检查解压后的目录结构
        const extractedItems = fs.readdirSync(extractDir)
        console.log("[ZIP] 解压后第一层内容:", extractedItems)

        // 如果解压后只有一个文件夹，则深入查找
        if (extractedItems.length === 1) {
          const firstItem = path.join(extractDir, extractedItems[0])
          if (fs.statSync(firstItem).isDirectory()) {
            // 检查第二层
            const secondLevelItems = fs.readdirSync(firstItem)
            console.log("[ZIP] 解压后第二层内容:", secondLevelItems)

            // 如果第二层有 Excel 文件或文件夹，直接使用
            const hasExcel = secondLevelItems.some(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
            if (hasExcel || secondLevelItems.length > 0) {
              sourceDir = firstItem
              console.log("[ZIP] 使用第二层目录:", sourceDir)
            }
          }
        } else {
          sourceDir = extractDir
        }
      } catch (e) {
        console.error("[ZIP] 解压失败:", e)
        return NextResponse.json({ error: "解压文件失败" }, { status: 500 })
      }
    }

    // 检查源目录结构
    console.log("[源目录]:", sourceDir)
    const sourceItems = fs.readdirSync(sourceDir)
    console.log("[源目录内容]:", sourceItems)

    // 统计找到的 Excel 文件
    let totalExcelFiles = 0
    const countExcelFiles = (dir: string): number => {
      let count = 0
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const itemPath = path.join(dir, item)
        if (fs.statSync(itemPath).isDirectory()) {
          count += countExcelFiles(itemPath)
        } else if (item.endsWith('.xlsx') || item.endsWith('.xls')) {
          count++
        }
      }
      return count
    }
    totalExcelFiles = countExcelFiles(sourceDir)
    console.log("[找到 Excel 文件数]:", totalExcelFiles)

    if (totalExcelFiles === 0) {
      return NextResponse.json({ error: "未找到任何 Excel 文件，请检查 ZIP 包结构" }, { status: 400 })
    }

    // 生成书籍 ID
    const bookId = `${Date.now()}-${bookName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')}`

    // 创建书本
    const book = await prisma.book.create({
      data: {
        id: bookId,
        name: bookName,
        type: bookType,
        subType: bookType === 'corpus' ? 'speaking' : bookType === 'vocabulary' ? 'general' : 'general',
      },
    })

    // 创建默认样式设置
    const defaultStyles = getDefaultFieldStyles(bookType)
    // 解析列名
    let parsedColumnNames: string[] | null = null
    if (columnNames && columnNames.trim()) {
      parsedColumnNames = columnNames.split(',').map(s => s.trim()).filter(s => s)
    }
    await prisma.bookStyleSettings.create({
      data: {
        bookId: book.id,
        fieldStyles: JSON.stringify(defaultStyles),
        columnNames: parsedColumnNames ? JSON.stringify(parsedColumnNames) : null
      }
    })

    // 解析并导入文件
    await importFilesToBook(sourceDir, book.id, bookType)

    // 清理临时目录
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }

    return NextResponse.json({ success: true, book })
  } catch (error) {
    console.error("[上传书籍错误]:", error)

    // 清理临时目录
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (e) { /* ignore */ }
    }

    return NextResponse.json({ error: "上传失败: " + (error as Error).message }, { status: 500 })
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
  return {
    primary: { fontSize: 'text-3xl', fontWeight: 'font-bold', color: 'text-primary', bold: true, italic: false },
    secondary: { fontSize: 'text-xl', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
    usageNote: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
    exampleEn: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
    exampleZh: { fontSize: 'text-sm', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false }
  }
}

async function importFilesToBook(dirPath: string, bookId: string, bookType: string) {
  const items = fs.readdirSync(dirPath)
  console.log("[importFilesToBook] 目录内容:", items)

  // 如果是单个Excel文件
  if (items.length === 1 && (items[0].endsWith('.xlsx') || items[0].endsWith('.xls'))) {
    console.log("[importFilesToBook] 单个文件:", items[0])
    await importSingleFile(path.join(dirPath, items[0]), bookId, bookType, '默认章节')
    return
  }

  // 如果是目录，遍历创建章节
  let chapterOrder = 0
  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      console.log("[importFilesToBook] 处理章节:", item)

      // 使用UUID生成唯一ID
      const chapterId = `${bookId}-ch-${uuidv4()}`

      const chapter = await prisma.chapter.create({
        data: {
          id: chapterId,
          bookId: bookId,
          name: item,
          order: chapterOrder,
        },
      })

      // 遍历目录下的 Excel 文件
      const files = fs.readdirSync(itemPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
      console.log("[importFilesToBook] 章节下的文件:", files)

      let fileOrder = 0
      for (const file of files) {
        const fileFullPath = path.join(itemPath, file)
        console.log("[importFilesToBook] 导入文件:", fileFullPath)
        // 传递 chapter 对象，包含 id 和 name
        await importSingleFile(fileFullPath, bookId, bookType, { id: chapter.id, name: chapter.name }, file.replace(/\.(xlsx|xls)$/, ''), fileOrder)
        fileOrder++
      }

      chapterOrder++
    } else if (item.endsWith('.xlsx') || item.endsWith('.xls')) {
      console.log("[importFilesToBook] 根目录文件:", item)
      await importSingleFile(itemPath, bookId, bookType, '默认章节')
    }
  }
}

async function importSingleFile(
  filePath: string,
  bookId: string,
  bookType: string,
  chapterInfo: { id: string; name: string } | string,
  subChapterName?: string,
  order: number = 0
) {
  console.log("[importSingleFile] 读取文件:", filePath)

  let workbook
  try {
    // 读取文件为 buffer，避免中文字符路径问题
    const fileBuffer = fs.readFileSync(filePath)
    workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  } catch (e) {
    console.error("[importSingleFile] 读取Excel失败:", filePath, e)
    return
  }

  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

  console.log("[importSingleFile] 数据行数:", data.length)

  if (data.length < 1) return

  // 确定章节 ID
  let chapterId: string
  if (typeof chapterInfo === 'object' && 'id' in chapterInfo) {
    // 已有章节对象
    chapterId = chapterInfo.id
  } else {
    // 创建默认章节（传入的是章节名称字符串）
    const chapter = await prisma.chapter.create({
      data: {
        id: `${bookId}-default-ch-${uuidv4()}`,
        bookId: bookId,
        name: chapterInfo as string,
        order: 0,
      },
    })
    chapterId = chapter.id
  }

  // 创建子章节，使用UUID生成唯一ID
  const subChapterId = `${chapterId}-sub-${uuidv4()}`
  const subChapter = await prisma.subChapter.upsert({
    where: { id: subChapterId },
    update: {},
    create: {
      id: subChapterId,
      chapterId: chapterId,
      name: subChapterName || '默认小节',
      order: order,
    },
  })

  // 解析卡片数据
  const isCorpus = bookType === 'corpus'

  // 删除现有卡片
  await prisma.card.deleteMany({ where: { subChapterId: subChapter.id } })

  // 创建新卡片
  let cardCount = 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row[0]) continue // 跳过空行

    await prisma.card.create({
      data: {
        subChapterId: subChapter.id,
        uuid: uuidv4(),
        contentPrimary: row[0] || '',
        contentSecondary: isCorpus ? (row[1] || '') : (row[1] || ''),
        usageNote: isCorpus ? (row[2] || '') : (row[2] || ''),
        exampleEn: isCorpus ? (row[3] || '') : (row[3] || ''),
        exampleZh: isCorpus ? (row[4] || '') : (row[4] || ''),
        analysis: isCorpus ? (row[5] || '') : null,
        order: i,
      },
    })
    cardCount++
  }

  console.log("[importSingleFile] 成功导入卡片数:", cardCount)
}
