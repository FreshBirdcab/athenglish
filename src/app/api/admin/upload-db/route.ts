import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('db') as File | null
    const token = formData.get('token') as string | null

    // 简单密码保护
    const UPLOAD_TOKEN = process.env.DB_UPLOAD_TOKEN || 'athenglish-upload-2024'

    if (!token || token !== UPLOAD_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    writeFileSync(dbPath, buffer)

    return NextResponse.json({
      success: true,
      size: buffer.length,
      message: 'Database uploaded successfully. Please restart the service to apply changes.',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
