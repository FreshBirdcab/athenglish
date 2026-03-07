"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Heart } from "lucide-react"

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

interface StudyListProps {
  cards: Card[]
  bookType: string
  annotations: Record<string, Annotation[]>
  onTextSelect: (cardId: string, text: string, start: number, end: number, field: string, position: { x: number; y: number }) => void
  onDeleteAnnotation: (cardId: string, annotationId: string) => void
  onHighlightClick: (cardId: string, annotation: Annotation, event: React.MouseEvent) => void
}

export function StudyList({ cards, bookType, annotations, onTextSelect, onDeleteAnnotation, onHighlightClick }: StudyListProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const contentRefs = useRef<Record<string, HTMLDivElement>>({})

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

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleFavorite = async (cardId: string) => {
    if (!session?.user) {
      alert("请先登录后再收藏")
      return
    }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, type: bookType === "vocabulary" ? "word" : "sentence" })
      })
      const data = await res.json()
      if (data.favorited) {
        setFavorites([...favorites, cardId])
      } else {
        setFavorites(favorites.filter(id => id !== cardId))
      }
    } catch (error) {
      console.error("收藏失败:", error)
    }
  }

  // 处理文本选择
  const handleTextSelect = (cardId: string, field: string, fieldText: string) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const selectedText = selection.toString().trim()
    if (!selectedText) return

    // 在原始文本中找到选中内容的位置
    const start = fieldText.indexOf(selectedText)
    if (start === -1) return

    const end = start + selectedText.length

    // 计算菜单位置
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    onTextSelect(cardId, selectedText, start, end, field, {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
  }

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

  const getCardFields = (card: Card) => {
    const fields: { key: string; text: string }[] = []
    fields.push({ key: "primary", text: card.contentPrimary })
    if (card.usageNote) fields.push({ key: "usageNote", text: card.usageNote })
    if (card.exampleEn) fields.push({ key: "exampleEn", text: card.exampleEn })
    if (card.analysis) fields.push({ key: "analysis", text: card.analysis })
    return fields
  }

  return (
    <div className="space-y-4">
      {cards.map((card, index) => {
        const isFavorited = favorites.includes(card.id)
        const cardAnnotations = annotations[card.id] || []
        const fields = getCardFields(card)

        return (
          <Card key={card.id} className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <Badge variant="outline">#{index + 1}</Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => speak(card.contentPrimary)}>
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(card.id)}
                  className={isFavorited ? "text-red-500" : ""}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-2" ref={el => { if (el) contentRefs.current[card.id] = el }}>
              {/* 词汇卡片布局 */}
              {bookType === "vocabulary" && (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-primary mb-1" data-field="primary" onMouseUp={() => handleTextSelect(card.id, "primary", card.contentPrimary)}>
                      {renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </h3>
                    <p className="text-lg text-muted-foreground">{card.contentSecondary}</p>
                  </div>
                  {card.usageNote && (
                    <div className="p-2 bg-muted/50 rounded-lg" data-field="usageNote" onMouseUp={() => handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className="text-sm">{renderHighlightedText(card.usageNote, card.id, "usageNote")}</p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="border-l-4 border-primary pl-3" data-field="exampleEn" onMouseUp={() => handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className="text-sm italic">{renderHighlightedText(card.exampleEn, card.id, "exampleEn")}</p>
                      {card.exampleZh && (
                        <p className="text-xs text-muted-foreground mt-1">{card.exampleZh}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 句型卡片布局 */}
              {bookType === "sentence" && (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 rounded-xl border" data-field="primary" onMouseUp={() => handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <p className="text-xl font-semibold text-primary">{renderHighlightedText(card.contentPrimary, card.id, "primary")}</p>
                    {card.contentSecondary && (
                      <p className="text-sm text-muted-foreground mt-1">{card.contentSecondary}</p>
                    )}
                  </div>
                  {card.usageNote && (
                    <div className="space-y-1" data-field="usageNote" onMouseUp={() => handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className="text-xs font-medium">用法说明</p>
                      <p className="text-sm text-muted-foreground">{renderHighlightedText(card.usageNote, card.id, "usageNote")}</p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="space-y-1" data-field="exampleEn" onMouseUp={() => handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className="text-xs font-medium">例句</p>
                      <p className="text-sm italic border-l-2 pl-2 border-primary">{renderHighlightedText(card.exampleEn, card.id, "exampleEn")}</p>
                      {card.exampleZh && (
                        <p className="text-xs text-muted-foreground">{card.exampleZh}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 语料卡片布局 */}
              {bookType === "corpus" && (
                <div className="space-y-3">
                  <div className="text-center py-1" data-field="primary" onMouseUp={() => handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <p className="text-base">{renderHighlightedText(card.contentPrimary, card.id, "primary")}</p>
                    {card.contentSecondary && (
                      <p className="text-sm text-muted-foreground">{card.contentSecondary}</p>
                    )}
                  </div>
                  {card.usageNote && (
                    <div className="p-2 bg-muted/50 rounded-lg" data-field="usageNote" onMouseUp={() => handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className="text-xs font-medium">要点</p>
                      <p className="text-sm text-muted-foreground">{renderHighlightedText(card.usageNote, card.id, "usageNote")}</p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="space-y-1" data-field="exampleEn" onMouseUp={() => handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className="text-xs font-medium">示例</p>
                      <p className="text-sm">{renderHighlightedText(card.exampleEn, card.id, "exampleEn")}</p>
                      {card.exampleZh && (
                        <p className="text-xs text-muted-foreground">{card.exampleZh}</p>
                      )}
                    </div>
                  )}
                  {card.analysis && (
                    <div className="p-2 bg-primary/5 rounded-lg" data-field="analysis" onMouseUp={() => handleTextSelect(card.id, "analysis", card.analysis || "")}>
                      <p className="text-xs font-medium">分析</p>
                      <p className="text-xs text-muted-foreground">{renderHighlightedText(card.analysis, card.id, "analysis")}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
