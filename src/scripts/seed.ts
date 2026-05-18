import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

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

async function parseExcelFile(filePath: string, bookType: string) {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

  // 没有标题行，第一行就是数据
  if (data.length < 1) return []

  // 根据书本类型解析不同的列（包含第一行）
  return data.map((row, index) => {
    if (bookType === 'speaking') {
      // 6列格式: question, answer_formal_en, answer_formal_zh, answer_casual_en, answer_casual_zh, analysis
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
      // 5列格式: word/pattern, meaning/pattern_zh, usage, example_en, example_zh
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

async function seedDatabase() {
  console.log('开始初始化数据库...')

  // 遍历 xlsx_materials 目录
  const bookDirs = fs.readdirSync(MATERIALS_DIR)

  for (const bookDir of bookDirs) {
    const bookPath = path.join(MATERIALS_DIR, bookDir)
    if (!fs.statSync(bookPath).isDirectory()) continue

    const config = BOOK_CONFIG[bookDir]
    if (!config) {
      console.log(`跳过未知目录: ${bookDir}`)
      continue
    }

    console.log(`处理书本: ${config.name}`)

    // 创建书本
    const book = await prisma.book.upsert({
      where: { id: bookDir },
      update: {},
      create: {
        id: bookDir,
        name: config.name,
        type: config.type,
        subType: config.subType,
      },
    })

    // 遍历章节
    const chapterDirs = fs.readdirSync(bookPath)

    for (const chapterDir of chapterDirs) {
      const chapterPath = path.join(bookPath, chapterDir)
      if (!fs.statSync(chapterPath).isDirectory()) continue

      console.log(`  处理章节: ${chapterDir}`)

      // 创建章节
      const chapter = await prisma.chapter.upsert({
        where: { id: `${bookDir}-${chapterDir}` },
        update: {},
        create: {
          id: `${bookDir}-${chapterDir}`,
          bookId: book.id,
          name: chapterDir,
        },
      })

      // 遍历子章节（Excel文件）
      const files = fs.readdirSync(chapterPath).filter(f => f.endsWith('.xlsx'))

      for (const file of files) {
        const filePath = path.join(chapterPath, file)
        const fileName = file.replace('.xlsx', '')
        const relativePath = path.join(bookDir, chapterDir, file)

        console.log(`    处理文件: ${fileName}`)

        // 创建子章节
        const subChapter = await prisma.subChapter.upsert({
          where: { id: `${bookDir}-${chapterDir}-${fileName}` },
          update: { filePath: relativePath },
          create: {
            id: `${bookDir}-${chapterDir}-${fileName}`,
            chapterId: chapter.id,
            name: fileName,
            filePath: relativePath,
          },
        })

        // 解析 Excel 并创建卡片
        const cards = await parseExcelFile(filePath, config.subType)

        // 删除现有卡片
        await prisma.card.deleteMany({ where: { subChapterId: subChapter.id } })

        // 创建新卡片
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

        console.log(`      已导入 ${cards.length} 条卡片`)
      }
    }
  }

  // 创建默认管理员用户
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@athenglish.com' } })
  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@athenglish.com',
        name: 'Admin',
        password: '$2a$10$rQEY9zF5Q5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', // 密码: admin123
        role: 'admin',
      },
    })
    console.log('创建默认管理员用户: admin@athenglish.com / admin123')
  }

  console.log('数据库初始化完成!')
}

seedDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
