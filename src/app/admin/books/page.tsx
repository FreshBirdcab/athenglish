"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, BookOpen, Upload, FolderOpen } from "lucide-react"
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

const AVAILABLE_BOOKS = [
  '001口语词汇-全场景',
  '001写作词汇-核心',
  '001写作词汇-主题',
  '001阅读词汇',
  '002写作句型-功能类',
  '003口语语料'
]

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [importMode, setImportMode] = useState<'select' | 'upload'>('select')
  const [selectedBookDir, setSelectedBookDir] = useState('')
  const [importing, setImporting] = useState(false)
  const [bookName, setBookName] = useState('')
  const [bookType, setBookType] = useState<'vocabulary' | 'sentence' | 'corpus'>('vocabulary')
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

  const handleImport = async () => {
    if (!selectedBookDir) {
      alert("请选择要导入的书籍")
      return
    }

    setImporting(true)
    try {
      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookDir: selectedBookDir })
      })
      const data = await res.json()

      if (data.success) {
        setShowAddModal(false)
        setSelectedBookDir('')
        fetchBooks()
      } else {
        alert(data.error || "导入失败")
      }
    } catch (error) {
      console.error("导入书籍失败:", error)
      alert("导入失败")
    } finally {
      setImporting(false)
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

      const res = await fetch("/api/admin/books/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        setShowAddModal(false)
        setSelectedFile(null)
        setBookName('')
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

  // 获取所有书籍目录（包括已导入的，用于重新导入）
  const availableBooks = AVAILABLE_BOOKS

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
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
              {/* 导入方式选择 */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={importMode === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportMode('select')}
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  选择目录
                </Button>
                <Button
                  variant={importMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImportMode('upload')}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  上传文件
                </Button>
              </div>

              {importMode === 'select' ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      选择书籍目录
                    </label>
                    <select
                      value={selectedBookDir}
                      onChange={(e) => setSelectedBookDir(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">请选择...</option>
                      {availableBooks.map(dir => {
                        const isImported = books.some(b => b.id === dir)
                        return (
                          <option key={dir} value={dir}>
                            {dir} {isImported ? '(已导入)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedBookDir('')
                      }}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!selectedBookDir || importing}
                    >
                      {importing ? "导入中..." : "确认导入"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
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
                      onChange={(e) => setBookType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="vocabulary">词汇</option>
                      <option value="sentence">句型</option>
                      <option value="corpus">语料</option>
                    </select>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      ZIP压缩包需包含Excel文件，格式要求：词汇/句型5列，语料6列
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddModal(false)
                        setSelectedFile(null)
                        setBookName('')
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
