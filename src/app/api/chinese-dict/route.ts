import { NextResponse } from 'next/server'
import https from 'https'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get('word')

  if (!word) {
    return NextResponse.json({ error: '缺少 word 参数' }, { status: 400 })
  }

  try {
    const url = `https://www.youdao.com/w/${encodeURIComponent(word)}/`

    const html = await new Promise<string>((resolve, reject) => {
      https.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve(data))
      }).on('error', reject).on('timeout', () => reject(new Error('超时')))
    })

    // 提取中文释义 - 有道格式: 词性 中文翻译
    // 例如: "int. 喂；你好"
    const translations: string[] = []

    // 匹配词性和翻译的组合
    const matches = html.matchAll(/(?:<li>)([^<]*?(?:int\.|n\.|v[ti]\.|adj\.|adv\.|conj\.|prep\.|phr\.|pron\.|num\.|art\.)\s*[^<]+)(?=\s*<)/gi)

    for (const match of matches) {
      let text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      // 只保留包含中文的翻译
      if (/[\u4e00-\u9fa5]/.test(text)) {
        translations.push(text)
      }
    }

    if (translations.length > 0) {
      return NextResponse.json({ translations: translations.slice(0, 5).join(' | ') })
    }

    // 备用: 直接提取 li 中的中文内容
    const liMatch = html.match(/<li>([^<]*[\u4e00-\u9fa5][^<]*)<\/li>/)
    if (liMatch) {
      const trans = liMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (trans) {
        return NextResponse.json({ translations: trans.slice(0, 300) })
      }
    }

    return NextResponse.json({ error: '未找到' }, { status: 404 })
  } catch (error) {
    console.error('中文词典查询错误:', error)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
