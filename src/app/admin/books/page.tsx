"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, BookOpen } from "lucide-react"
import Link from "next/link"

interface Book {
  id: string
  name: string
  type: string
  subType: string | null
  description: string | null
  cover: string | null
  totalCards: number
  chapterCount: number
  subChapterCount: number
}

const BOOK_TYPE_LABELS: Record<string, string> = {
  vocabulary: '词汇',
  sentence: '句型',
  corpus: '语料'
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [bookName, setBookName] = useState('')
  const [bookType, setBookType] = useState<'vocabulary' | 'sentence' | 'corpus'>('vocabulary')
  const [columnCount, setColumnCount] = useState<number>(5)
  const [columnNames, setColumnNames] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/admin/books")
      const data = await res.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error("获取书籍失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bookId: string) => {
    if (!confirm("确定要删除这本书吗？此操作将删除所有相关的章节、小节和卡片数据，且无法恢复。")) {
      return
    }

    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE"
      })
      const data = await res.json()

      if (data.success) {
        setBooks(books.filter(b => b.id !== bookId))
      } else {
        alert(data.error || "删除失败")
      }
    } catch (error) {
      console.error("删除书籍失败:", error)
      alert("删除失败")
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("请选择要上传的文件")
      return
    }

    if (!bookName.trim()) {
      alert("请输入书籍名称")
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('bookName', bookName)
      formData.append('bookType', bookType)
      formData.append('columnCount', String(columnCount))
      formData.append('columnNames', columnNames)

      const res = await fetch("/api/admin/books/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        setShowAddModal(false)
        setSelectedFile(null)
        setBookName('')
        setColumnNames('')
        setColumnCount(5)
        fetchBooks()
      } else {
        alert(data.error || "上传失败")
      }
    } catch (error) {
      console.error("上传书籍失败:", error)
      alert("上传失败")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">书籍管理</h1>
          <p className="text-muted-foreground">管理教材书籍和卡片数据</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          导入书籍
        </Button>
      </div>

      {/* 书籍列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => (
          <Card key={book.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{book.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {BOOK_TYPE_LABELS[book.type] || book.type}
                    </Badge>
                    {book.subType && (
                      <Badge variant="outline">
                        {book.subType}
                      </Badge>
                    )}
                  </div>
                </div>
                {book.cover && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={book.cover}
                      alt={book.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center justify-between">
                  <span>章节</span>
                  <span className="font-medium">{book.chapterCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>小节</span>
                  <span className="font-medium">{book.subChapterCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>卡片</span>
                  <span className="font-medium">{book.totalCards}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/books/${book.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-3 w-3 mr-1" />
                    编辑
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => handleDelete(book.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {books.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">暂无书籍</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  导入第一本书
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 添加书籍弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>导入书籍</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      书籍名称
                    </label>
                    <input
                      type="text"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="输入书籍名称"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      书籍类型
                    </label>
                    <select
                      value={bookType}
                      onChange={(e) => {
                        setBookType(e.target.value as any)
                        setColumnCount(e.target.value === 'corpus' ? 6 : 5)
                      }}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="vocabulary">词汇</option>
                      <option value="sentence">句型</option>
                      <option value="corpus">语料</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      列数
                    </label>
                    <input
                      type="number"
                      value={columnCount}
                      onChange={(e) => setColumnCount(Number(e.target.value))}
                      min={1}
                      max={10}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      自定义列名 (可选)
                    </label>
                    <input
                      type="text"
                      value={columnNames}
                      onChange={(e) => setColumnNames(e.target.value)}
                      placeholder={columnCount === 5
                        ? "如: 单词,释义,用法,例句,翻译"
                        : "如: 问题,正式,正式ZH,口语,口语ZH,分析"}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      多个列名用逗号分隔，仅供管理员识别
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      上传文件 (ZIP压缩包或Excel文件)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.zip"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedFile(null)
                        setBookName('')
                        setColumnNames('')
                        setColumnCount(5)
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || !bookName.trim() || importing}
                    >
                      {importing ? "上传中..." : "确认上传"}
                    </Button>
                  </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
