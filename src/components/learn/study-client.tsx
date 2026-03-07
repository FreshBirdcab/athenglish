"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Volume2, Heart } from "lucide-react"

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
  annotations: Record<string, Annotation[]>
  setAnnotations: React.Dispatch<React.SetStateAction<Record<string, Annotation[]>>>
  selectedText: { text: string; start: number; end: number; field: string; cardId: string; annotationId?: string; highlight?: string | null; note?: string | null } | null
  setSelectedText: React.Dispatch<React.SetStateAction<{ text: string; start: number; end: number; field: string; cardId: string; annotationId?: string; highlight?: string | null; note?: string | null } | null>>
  showMenu: boolean
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>
  menuPosition: { x: number; y: number }
  setMenuPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  showNoteInput: boolean
  setShowNoteInput: React.Dispatch<React.SetStateAction<boolean>>
  noteText: string
  setNoteText: React.Dispatch<React.SetStateAction<string>>
  onAddHighlight: (color: string) => void
  onAddNote: () => void
  onDeleteAnnotation: (cardId: string, annotationId: string) => void
  onHighlightClick: (cardId: string, annotation: Annotation, event: React.MouseEvent) => void
}

export function StudyClient({
  cards,
  subChapterId,
  bookType,
  annotations,
  selectedText,
  setSelectedText,
  showMenu,
  setShowMenu,
  menuPosition,
  setMenuPosition,
  showNoteInput,
  setShowNoteInput,
  noteText,
  setNoteText,
  onAddHighlight,
  onAddNote,
  onDeleteAnnotation,
  onHighlightClick
}: StudyClientProps) {
  const { data: session } = useSession()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
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

    const selectedTextContent = selection.toString().trim()
    if (!selectedTextContent) {
      setShowMenu(false)
      return
    }

    const contentElement = contentRef.current
    if (!contentElement || !currentCard) return

    // 查找选中内容属于哪个字段
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
    if (field === "primary") fieldText = currentCard.contentPrimary
    else if (field === "usageNote") fieldText = currentCard.usageNote || ""
    else if (field === "exampleEn") fieldText = currentCard.exampleEn || ""
    else if (field === "analysis") fieldText = currentCard.analysis || ""

    // 在原始文本中找到选中内容的位置
    const start = fieldText.indexOf(selectedTextContent)

    if (start === -1) {
      // 如果原始文本中找不到，使用 DOM 计算作为后备
      const fieldEl = contentElement.querySelector(`[data-field="${field}"]`)
      if (!fieldEl) return

      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(fieldEl)
      preCaretRange.setEnd(range.startContainer, range.startOffset)
      const calculatedStart = preCaretRange.toString().length
      setSelectedText({ text: selectedTextContent, start: calculatedStart, end: calculatedStart + selectedTextContent.length, field, cardId: currentCard.id })
    } else {
      setSelectedText({ text: selectedTextContent, start, end: start + selectedTextContent.length, field, cardId: currentCard.id })
    }

    // 计算菜单位置
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    setShowMenu(true)
  }, [currentCard, setSelectedText, setShowMenu, setMenuPosition])

  // 渲染带高亮的文本
  const renderHighlightedText = (text: string, cardId: string, field: string) => {
    const cardAnnotations = annotations[cardId] || []
    const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field)
    if (fieldAnnotations.length === 0) return text

    const sorted = [...fieldAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)

    // 过滤重叠
    const validAnnotations: Annotation[] = []
    for (const ann of sorted) {
      const isOverlapping = validAnnotations.some(
        existing => !(ann.endOffset <= existing.startOffset || ann.startOffset >= existing.endOffset)
      )
      if (!isOverlapping) {
        validAnnotations.push(ann)
      }
    }

    const parts: React.JSX.Element[] = []
    let lastEnd = 0

    validAnnotations.forEach((ann: Annotation, index: number) => {
      if (ann.startOffset < lastEnd) return

      if (ann.startOffset > lastEnd) {
        parts.push(<span key={`text-${field}-${index}`}>{text.slice(lastEnd, ann.startOffset)}</span>)
      }

      parts.push(
        <span
          key={`highlight-${field}-${index}`}
          className={`relative group cursor-pointer px-0.5 rounded ${ann.note ? "border-b-2 border-dashed border-amber-500" : ""}`}
          style={{ backgroundColor: ann.highlight || undefined }}
          onClick={(e) => onHighlightClick(cardId, ann, e)}
        >
          {text.slice(ann.startOffset, ann.endOffset)}
          {ann.note && (
            <span className="absolute -top-6 left-0 text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {ann.note}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteAnnotation(cardId, ann.id); }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </span>
      )

      lastEnd = ann.endOffset
    })

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
