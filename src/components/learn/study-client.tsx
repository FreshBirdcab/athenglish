"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight, Volume2, Heart, Highlighter, StickyNote, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Card {
  id: string
  contentPrimary: string
  contentSecondary: string | null
  usageNote: string | null
  exampleEn: string | null
  exampleZh: string | null
  analysis: string | null
}

interface Annotation {
  id: string
  startOffset: number
  endOffset: number
  highlight: string | null
  note: string | null
  field: string
}

interface StudyClientProps {
  cards: Card[]
  subChapterId: string
  bookType: string
  bookSubType: string | null
}

const HIGHLIGHT_COLORS = [
  { name: "黄色", value: "#fef08a", label: "yellow" },
  { name: "绿色", value: "#bbf7d0", label: "green" },
  { name: "蓝色", value: "#bfdbfe", label: "blue" },
  { name: "粉色", value: "#fbcfe8", label: "pink" },
  { name: "橙色", value: "#fed7aa", label: "orange" },
]

export function StudyClient({ cards, subChapterId, bookType }: StudyClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({})
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number; field: string } | null>(null)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const contentRef = useRef<HTMLDivElement>(null)

  const currentCard = cards[currentIndex]
  const total = cards.length

  // 加载收藏状态
  useEffect(() => {
    if (session?.user) {
      fetch("/api/favorites")
        .then(res => res.json())
        .then(data => {
          if (data.favorites) {
            setFavorites(data.favorites.map((f: any) => f.cardId))
          }
        })
        .catch(console.error)
    }
  }, [session])

  // 加载批注状态
  useEffect(() => {
    if (session?.user && currentCard) {
      fetch(`/api/annotations?cardId=${currentCard.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.annotations) {
            setAnnotations(prev => ({
              ...prev,
              [currentCard.id]: data.annotations
            }))
          }
        })
        .catch(console.error)
    }
  }, [session, currentCard])

  // 检查当前卡片是否已收藏
  useEffect(() => {
    if (currentCard) {
      setFavorited(favorites.includes(currentCard.id))
    }
  }, [currentCard, favorites])

  const goNext = async () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(((currentIndex + 1) / total) * 100)
      if (session?.user && currentCard) {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: currentCard.id, status: "learning" })
        })
      }
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(((currentIndex - 1) / total) * 100)
    }
  }

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user) {
      alert("请先登录后再收藏")
      return
    }
    if (!currentCard) return
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: currentCard.id, type: bookType === "vocabulary" ? "word" : "sentence" })
      })
      const data = await res.json()
      if (data.favorited) {
        setFavorites([...favorites, currentCard.id])
      } else {
        setFavorites(favorites.filter(id => id !== currentCard.id))
      }
    } catch (error) {
      console.error("收藏失败:", error)
    }
  }

  const handleNextClick = async () => {
    if (session?.user && currentCard) {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: currentCard.id, status: "learning" })
        })
      } catch (error) {
        console.error("保存进度失败:", error)
      }
    }
    goNext()
  }

  // 处理文本选择
  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setShowMenu(false)
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      setShowMenu(false)
      return
    }

    // 获取选中内容在文本中的位置
    const contentElement = contentRef.current
    if (!contentElement) return

    // 查找选中内容属于哪个字段 - 向上查找data-field属性
    let fieldElement = selection.anchorNode?.parentElement
    let field = "primary"
    while (fieldElement && fieldElement !== contentElement) {
      if (fieldElement.dataset.field) {
        field = fieldElement.dataset.field
        break
      }
      fieldElement = fieldElement.parentElement
    }

    // 获取该字段的原始文本内容
    let fieldText = ""
    if (field === "primary") fieldText = currentCard?.contentPrimary || ""
    else if (field === "usageNote") fieldText = currentCard?.usageNote || ""
    else if (field === "exampleEn") fieldText = currentCard?.exampleEn || ""
    else if (field === "analysis") fieldText = currentCard?.analysis || ""

    // 计算选中区域相对于该字段文本的位置
    const range = selection.getRangeAt(0)

    // 获取字段元素
    const fieldEl = contentElement.querySelector(`[data-field="${field}"]`)
    if (!fieldEl) return

    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(fieldEl)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const start = preCaretRange.toString().length
    const end = start + text.length

    setSelectedText({ text, start, end, field: field as any })

    // 计算菜单位置
    const rect = range.getBoundingClientRect()
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    setShowMenu(true)
  }, [currentCard])

  // 添加高亮
  const addHighlight = async (color: string) => {
    if (!session?.user || !selectedText || !currentCard) return

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.id,
          startOffset: selectedText.start,
          endOffset: selectedText.end,
          highlight: color,
          field: selectedText.field || "primary"
        })
      })
      const data = await res.json()
      if (data.annotation) {
        setAnnotations(prev => ({
          ...prev,
          [currentCard.id]: [...(prev[currentCard.id] || []), { ...data.annotation, field: selectedText.field || "primary" }]
        }))
      }
    } catch (error) {
      console.error("添加高亮失败:", error)
    }

    setShowMenu(false)
    window.getSelection()?.removeAllRanges()
  }

  // 添加批注
  const addNote = async () => {
    if (!session?.user || !selectedText || !currentCard || !noteText.trim()) return

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.id,
          startOffset: selectedText.start,
          endOffset: selectedText.end,
          note: noteText.trim(),
          field: selectedText.field || "primary"
        })
      })
      const data = await res.json()
      if (data.annotation) {
        setAnnotations(prev => ({
          ...prev,
          [currentCard.id]: [...(prev[currentCard.id] || []), { ...data.annotation, field: selectedText.field || "primary" }]
        }))
      }
    } catch (error) {
      console.error("添加批注失败:", error)
    }

    setShowNoteInput(false)
    setNoteText("")
    setShowMenu(false)
    window.getSelection()?.removeAllRanges()
  }

  // 删除批注
  const deleteAnnotation = async (annotationId: string) => {
    if (!currentCard) return

    try {
      await fetch(`/api/annotations?id=${annotationId}`, { method: "DELETE" })
      setAnnotations(prev => ({
        ...prev,
        [currentCard.id]: prev[currentCard.id].filter((a: Annotation) => a.id !== annotationId)
      }))
    } catch (error) {
      console.error("删除批注失败:", error)
    }
  }

  // 渲染带高亮的文本
  const renderHighlightedText = (text: string, cardId: string, field: string) => {
    const cardAnnotations = annotations[cardId] || []
    // 筛选当前字段的批注
    const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field)
    if (fieldAnnotations.length === 0) return text

    // 按起始位置排序
    const sorted = [...fieldAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)

    const parts: JSX.Element[] = []
    let lastEnd = 0

    sorted.forEach((ann: Annotation, index: number) => {
      // 添加普通文本
      if (ann.startOffset > lastEnd) {
        parts.push(<span key={`text-${field}-${index}`}>{text.slice(lastEnd, ann.startOffset)}</span>)
      }

      // 添加高亮文本
      parts.push(
        <span
          key={`highlight-${field}-${index}`}
          className="relative group cursor-pointer px-0.5 rounded"
          style={{ backgroundColor: ann.highlight || undefined }}
        >
          {text.slice(ann.startOffset, ann.endOffset)}
          {ann.note && (
            <span className="absolute -top-6 left-0 text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {ann.note}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </span>
      )

      lastEnd = ann.endOffset
    })

    // 添加剩余文本
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.slice(lastEnd)}</span>)
    }

    return parts
  }

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>学习进度</span>
          <span>{currentIndex + 1} / {total}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 阅读模式内容 */}
      <div className="min-h-[400px]">
        {currentCard && (
          <div className="w-full">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <Badge variant="outline">#{currentIndex + 1}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => speak(currentCard.contentPrimary)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    className={favorited ? "text-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent onMouseUp={handleTextSelect} ref={contentRef}>
                {/* 词汇卡片布局 */}
                {bookType === "vocabulary" && (
                  <div className="space-y-4">
                    <div className="text-center py-2" data-field="primary">
                      <CardTitle className="text-3xl font-bold text-primary mb-2">
                        {renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </CardTitle>
                      <p className="text-xl text-muted-foreground">{currentCard.contentSecondary}</p>
                    </div>
                    {currentCard.usageNote && (
                      <div className="p-3 bg-muted/50 rounded-lg" data-field="usageNote">
                        <p className="text-sm">{renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}</p>
                      </div>
                    )}
                    {currentCard.exampleEn && (
                      <div className="border-l-4 border-primary pl-4" data-field="exampleEn">
                        <p className="text-base italic">{renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}</p>
                        {currentCard.exampleZh && (
                          <p className="text-sm text-muted-foreground mt-1">{currentCard.exampleZh}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 句型卡片布局 */}
                {bookType === "sentence" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-xl border" data-field="primary">
                      <p className="text-2xl font-semibold text-primary">{renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}</p>
                      {currentCard.contentSecondary && (
                        <p className="text-muted-foreground mt-2">{currentCard.contentSecondary}</p>
                      )}
                    </div>
                    {currentCard.usageNote && (
                      <div className="space-y-2" data-field="usageNote">
                        <p className="text-sm font-medium">用法说明</p>
                        <p className="text-sm text-muted-foreground">{renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}</p>
                      </div>
                    )}
                    {currentCard.exampleEn && (
                      <div className="space-y-2" data-field="exampleEn">
                        <p className="text-sm font-medium">例句</p>
                        <p className="text-base italic border-l-2 pl-3 border-primary">{renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}</p>
                        {currentCard.exampleZh && (
                          <p className="text-sm text-muted-foreground">{currentCard.exampleZh}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 语料卡片布局 */}
                {bookType === "corpus" && (
                  <div className="space-y-4">
                    <div className="text-center py-2" data-field="primary">
                      <CardTitle className="text-xl font-normal mb-2">
                        {renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </CardTitle>
                      {currentCard.contentSecondary && (
                        <p className="text-muted-foreground">{currentCard.contentSecondary}</p>
                      )}
                    </div>
                    {currentCard.usageNote && (
                      <div className="p-3 bg-muted/50 rounded-lg" data-field="usageNote">
                        <p className="text-sm font-medium">要点</p>
                        <p className="text-sm text-muted-foreground mt-1">{renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}</p>
                      </div>
                    )}
                    {currentCard.exampleEn && (
                      <div className="space-y-2" data-field="exampleEn">
                        <p className="text-sm font-medium">示例</p>
                        <p className="text-base">{renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}</p>
                        {currentCard.exampleZh && (
                          <p className="text-sm text-muted-foreground">{currentCard.exampleZh}</p>
                        )}
                      </div>
                    )}
                    {currentCard.analysis && (
                      <div className="p-3 bg-primary/5 rounded-lg" data-field="analysis">
                        <p className="text-sm font-medium">分析</p>
                        <p className="text-sm text-muted-foreground mt-1">{renderHighlightedText(currentCard.analysis, currentCard.id, "analysis")}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 高亮/批注菜单 */}
      {showMenu && selectedText && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border p-2 flex gap-1"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color.label}
              onClick={() => addHighlight(color.value)}
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
          <Popover open={showNoteInput} onOpenChange={setShowNoteInput}>
            <PopoverTrigger asChild>
              <button
                onClick={() => { setShowNoteInput(true); }}
                className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform"
                title="添加批注"
              >
                <StickyNote className="w-3 h-3 text-amber-700" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64" side="top">
              <div className="space-y-2">
                <p className="text-sm font-medium">添加批注</p>
                <Input
                  placeholder="输入批注内容..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <Button size="sm" onClick={addNote} className="w-full">保存</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 导航按钮 */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一个
        </Button>
        <Button onClick={handleNextClick} disabled={currentIndex === total - 1}>
          下一个
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* 快捷键提示 */}
      <div className="text-center text-xs text-muted-foreground">
        快捷键: ← → 切换卡片 | V 发音 | 选中文字可高亮或添加批注
      </div>
    </div>
  )
}
