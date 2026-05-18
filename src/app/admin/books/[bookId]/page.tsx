"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Save, RefreshCw } from "lucide-react"
import Link from "next/link"

interface FieldStyle {
  fontSize: string
  fontWeight: string
  color: string
  bold: boolean
  italic: boolean
}

interface BookStyles {
  primary: FieldStyle
  secondary: FieldStyle
  usageNote: FieldStyle
  exampleEn: FieldStyle
  exampleZh: FieldStyle
  analysis?: FieldStyle
}

interface Book {
  id: string
  name: string
  type: string
  description: string | null
}

const FONT_SIZE_OPTIONS = [
  { value: 'text-xs', label: '特小' },
  { value: 'text-sm', label: '小' },
  { value: 'text-base', label: '默认' },
  { value: 'text-lg', label: '大' },
  { value: 'text-xl', label: '特大' },
  { value: 'text-2xl', label: '2倍大' },
  { value: 'text-3xl', label: '3倍大' },
  { value: 'text-4xl', label: '4倍大' },
]

const FONT_WEIGHT_OPTIONS = [
  { value: 'font-thin', label: '极细' },
  { value: 'font-light', label: '细' },
  { value: 'font-normal', label: '正常' },
  { value: 'font-medium', label: '中等' },
  { value: 'font-semibold', label: '半粗' },
  { value: 'font-bold', label: '粗' },
]

const COLOR_OPTIONS = [
  { value: 'text-primary', label: '主题色' },
  { value: 'text-secondary', label: '次要色' },
  { value: 'text-muted-foreground', label: '灰色' },
  { value: 'text-foreground', label: '前景色' },
  { value: 'text-red-500', label: '红色' },
  { value: 'text-blue-500', label: '蓝色' },
  { value: 'text-green-500', label: '绿色' },
  { value: 'text-yellow-500', label: '黄色' },
]

const DEFAULT_FIELD_LABELS: Record<string, string> = {
  primary: '主要字段',
  secondary: '次要字段',
  usageNote: '用法说明',
  exampleEn: '英文例句',
  exampleZh: '中文例句',
  analysis: '分析'
}

// 列名索引映射
const FIELD_TO_INDEX: Record<string, number> = {
  primary: 0,
  secondary: 1,
  usageNote: 2,
  exampleEn: 3,
  exampleZh: 4,
  analysis: 5
}

export default function BookEditPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.bookId as string

  const [book, setBook] = useState<Book | null>(null)
  const [styles, setStyles] = useState<BookStyles | null>(null)
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [columnNamesInput, setColumnNamesInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bookName, setBookName] = useState('')
  const [bookDescription, setBookDescription] = useState('')

  useEffect(() => {
    fetchBookData()
  }, [bookId])

  const fetchBookData = async () => {
    try {
      const [bookRes, stylesRes] = await Promise.all([
        fetch(`/api/admin/books/${bookId}`),
        fetch(`/api/admin/books/${bookId}/styles`)
      ])

      const bookData = await bookRes.json()
      const stylesData = await stylesRes.json()

      if (bookData.book) {
        setBook(bookData.book)
        setBookName(bookData.book.name)
        setBookDescription(bookData.book.description || '')
      }

      if (stylesData.styles) {
        setStyles(stylesData.styles)
      }

      if (stylesData.columnNames) {
        setColumnNames(stylesData.columnNames)
        setColumnNamesInput(stylesData.columnNames.join(', '))
      }
    } catch (error) {
      console.error("获取书籍数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStyles = async () => {
    if (!styles) return

    // 解析列名
    const parsedColumnNames = columnNamesInput.split(',').map(s => s.trim()).filter(s => s)

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/books/${bookId}/styles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldStyles: styles, columnNames: parsedColumnNames })
      })

      const data = await res.json()
      if (data.success) {
        alert("保存成功")
      } else {
        alert(data.error || "保存失败")
      }
    } catch (error) {
      console.error("保存样式失败:", error)
      alert("保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBookInfo = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bookName,
          description: bookDescription
        })
      })

      const data = await res.json()
      if (data.success) {
        alert("保存成功")
        if (book) {
          setBook({ ...book, name: bookName, description: bookDescription })
        }
      } else {
        alert(data.error || "保存失败")
      }
    } catch (error) {
      console.error("保存书籍信息失败:", error)
      alert("保存失败")
    } finally {
      setSaving(false)
    }
  }

  const updateFieldStyle = (
    field: keyof BookStyles,
    key: keyof FieldStyle,
    value: string | boolean
  ) => {
    if (!styles) return

    setStyles({
      ...styles,
      [field]: {
        ...styles[field],
        [key]: value
      }
    })
  }

  const resetToDefault = () => {
    const defaultStyles = book?.type === 'corpus' ? {
      primary: { fontSize: 'text-xl', fontWeight: 'font-bold', color: 'text-primary', bold: true, italic: false },
      secondary: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      usageNote: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      exampleEn: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      exampleZh: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      analysis: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: true }
    } : {
      primary: { fontSize: 'text-3xl', fontWeight: 'font-bold', color: 'text-primary', bold: true, italic: false },
      secondary: { fontSize: 'text-xl', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      usageNote: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      exampleEn: { fontSize: 'text-base', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false },
      exampleZh: { fontSize: 'text-sm', fontWeight: 'normal', color: 'text-muted-foreground', bold: false, italic: false }
    }

    setStyles(defaultStyles as BookStyles)
  }

  // 获取当前书籍类型可用的字段
  const getAvailableFields = () => {
    if (!book) return []
    const allFields: (keyof BookStyles)[] = ['primary', 'secondary', 'usageNote', 'exampleEn', 'exampleZh']
    if (book.type === 'corpus') {
      allFields.push('analysis')
    }
    return allFields
  }

  // 获取字段显示标签
  const getFieldLabel = (field: string) => {
    const index = FIELD_TO_INDEX[field]
    // 优先使用输入框的值（实时更新），其次使用保存的值
    const parsedInput = columnNamesInput.split(',').map(s => s.trim()).filter(s => s)
    if (parsedInput[index]) {
      return parsedInput[index]
    }
    if (columnNames && columnNames[index]) {
      return columnNames[index]
    }
    return DEFAULT_FIELD_LABELS[field] || field
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!book || !styles) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">书籍不存在</p>
        <Link href="/admin/books">
          <Button className="mt-4">返回书籍列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/books">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{book.name}</h1>
          <p className="text-muted-foreground">编辑书籍信息和字段样式</p>
        </div>
      </div>

      {/* 书籍基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>书籍信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bookName">书籍名称</label>
              <Input
                id="bookName"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label>书籍类型</label>
              <div className="mt-1">
                <Badge variant="secondary">
                  {book.type === 'vocabulary' ? '词汇' : book.type === 'sentence' ? '句型' : '语料'}
                </Badge>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="bookDescription">描述</label>
            <Input
              id="bookDescription"
              value={bookDescription}
              onChange={(e) => setBookDescription(e.target.value)}
              className="mt-1"
              placeholder="可选描述..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveBookInfo} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              保存书籍信息
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 字段样式设置 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>字段样式设置</CardTitle>
              <Button variant="outline" size="sm" onClick={resetToDefault}>
                <RefreshCw className="h-4 w-4 mr-2" />
                恢复默认
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  value={columnNamesInput}
                  onChange={(e) => setColumnNamesInput(e.target.value)}
                  placeholder={book?.type === 'corpus'
                    ? "自定义列名(可选): 问题, 正式, 正式中文, 口语, 口语中文, 分析"
                    : "自定义列名(可选): 单词, 释义, 用法, 例句, 翻译"}
                />
              </div>
              {columnNamesInput && (
                <div className="flex flex-wrap gap-1">
                  {columnNamesInput.split(',').map((name, index) => name.trim() && (
                    <Badge key={index} variant="outline" className="text-xs">
                      {index + 1}:{name.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {getAvailableFields().map(field => (
              <div key={field} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="font-medium">{getFieldLabel(field)}</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={styles[field]?.bold ?? false}
                        onChange={(e) => updateFieldStyle(field, 'bold', e.target.checked)}
                        className="rounded"
                      />
                      加粗
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={styles[field]?.italic ?? false}
                        onChange={(e) => updateFieldStyle(field, 'italic', e.target.checked)}
                        className="rounded"
                      />
                      斜体
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs">字体大小</label>
                    <select
                      value={styles[field]?.fontSize ?? ''}
                      onChange={(e) => updateFieldStyle(field, 'fontSize', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {FONT_SIZE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.value})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">字重</label>
                    <select
                      value={styles[field]?.fontWeight ?? ''}
                      onChange={(e) => updateFieldStyle(field, 'fontWeight', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {FONT_WEIGHT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.value})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">颜色</label>
                    <select
                      value={styles[field]?.color ?? ''}
                      onChange={(e) => updateFieldStyle(field, 'color', e.target.value)}
                      className="w-full mt-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      {COLOR_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 预览 */}
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className={`${styles[field]?.fontSize ?? ''} ${styles[field]?.fontWeight ?? ''} ${styles[field]?.color ?? ''} ${styles[field]?.italic ? 'italic' : ''}`}>
                    {field === 'primary' && '示例单词'}
                    {field === 'secondary' && '示例释义'}
                    {field === 'usageNote' && '用法说明示例'}
                    {field === 'exampleEn' && 'This is an example sentence.'}
                    {field === 'exampleZh' && '这是一个例句。'}
                    {field === 'analysis' && '分析内容示例'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveStyles} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              保存样式和列名
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
