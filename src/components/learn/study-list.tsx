"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Heart, PenLine } from "lucide-react"
import { renderHighlightedText as renderAnnotatedText } from "@/lib/render-highlighted-text"

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

interface FieldStyle {
  fontSize: string
  fontWeight: string
  color: string
  bold: boolean
  italic: boolean
}

interface StudyListProps {
  cards: Card[]
  bookType: string
  annotations: Record<string, Annotation[]>
  onTextSelect: (cardId: string, text: string, start: number, end: number, field: string, position: { x: number; y: number }) => void
  onHighlightClick: (cardId: string, annotation: Annotation, event: React.MouseEvent) => void
  fieldStyles?: Record<string, FieldStyle> | null
}

export function StudyList({ cards, bookType, annotations, onTextSelect, onHighlightClick, fieldStyles }: StudyListProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const contentRefs = useRef<Record<string, HTMLDivElement>>({})

  // 预加载语音合成器voice
  const [cachedVoice, setCachedVoice] = useState<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        const selectedVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en-US'))
          || voices.find(v => v.lang === 'en-US')
          || voices.find(v => v.lang.startsWith('en'))
          || null
        setCachedVoice(selectedVoice)
      }

      if (window.speechSynthesis.getVoices().length > 0) {
        loadVoice()
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoice
      }
    }
  }, [])

  // 获取字段样式类名
  const getFieldStyleClass = (field: string): string => {
    if (!fieldStyles || !fieldStyles[field]) return ''
    const style = fieldStyles[field]
    return `${style.fontSize} ${style.fontWeight} ${style.color} ${style.italic ? 'italic' : ''}`.trim()
  }

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

  // 切换收藏
  const toggleFavorite = async (cardId: string) => {
    if (!session?.user) return

    const isFavorited = favorites.includes(cardId)
    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId })
      })
      setFavorites(prev =>
        isFavorited ? prev.filter(id => id !== cardId) : [...prev, cardId]
      )
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  // 朗读功能
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      if (cachedVoice) {
        utterance.voice = cachedVoice
      }
      window.speechSynthesis.speak(utterance)
    }
  }

  // 处理文本选择
  const handleTextSelect = useCallback((cardId: string, field: string, fieldText: string) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      return
    }

    const selectedTextContent = selection.toString().trim()
    if (!selectedTextContent) {
      return
    }

    // 获取选中内容在原始文本中的位置
    const range = selection.getRangeAt(0)

    // 统计字段中该文本出现的次数
    const allOccurrences: number[] = []
    let searchPos = 0
    while (true) {
      const pos = fieldText.indexOf(selectedTextContent, searchPos)
      if (pos === -1) break
      allOccurrences.push(pos)
      searchPos = pos + 1
    }

    let start: number

    // 如果只出现一次，直接用 indexOf
    if (allOccurrences.length === 1) {
      start = allOccurrences[0]
    } else {
      // 多次出现时，使用 DOM 位置计算来确定是第几个
      const cardEl = document.getElementById(`card-${cardId}`)
      if (!cardEl) return

      const fieldEl = cardEl.querySelector(`[data-field="${field}"]`)
      if (!fieldEl) return

      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(fieldEl)
      preCaretRange.setEnd(range.startContainer, range.startOffset)
      const domPos = preCaretRange.toString().length

      // 找到最接近 DOM 位置的文本位置
      start = allOccurrences[0]
      for (const pos of allOccurrences) {
        if (Math.abs(pos - domPos) < Math.abs(start - domPos)) {
          start = pos
        }
      }
    }

    const end = start + selectedTextContent.length

    // 计算菜单位置
    const rect = range.getBoundingClientRect()
    onTextSelect(cardId, selectedTextContent, start, end, field, { x: rect.left + rect.width / 2, y: rect.top })
  }, [onTextSelect])

  // 获取高亮字段
  const getHighlightedFields = (cardId: string): string[] => {
    const cardAnnotations = annotations[cardId] || []
    const fields = new Set<string>()
    cardAnnotations
      .filter(a => a.highlight)
      .forEach(a => {
        if (a.field) fields.add(a.field)
      })
    return Array.from(fields)
  }

  // 渲染带批注的文本（使用共享工具函数）
  const renderHighlightedText = (text: string, cardId: string, field: string) => {
    const cardAnnotations = annotations[cardId] || []
    return renderAnnotatedText(text, cardAnnotations, field, (ann) => {
      onHighlightClick(cardId, ann, { stopPropagation: () => {} } as React.MouseEvent)
    })
  }

  return (
    <div className="space-y-4">
      {cards.map((card, index) => {
        const isFavorited = favorites.includes(card.id)
        const cardAnnotations = annotations[card.id] || []
        const fields = getHighlightedFields(card.id)

        return (
          <Card key={card.id} id={`card-${card.id}`} className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              {/* 左侧：序号 */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
              </div>

              {/* 右侧：操作按钮组 */}
              <div className="flex items-center gap-0.5">
                {/* 收藏按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(card.id)}
                  className="h-8 w-8 p-0"
                  title={isFavorited ? "取消收藏" : "收藏"}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-2" ref={el => { if (el) contentRefs.current[card.id] = el }}>
              {/* 词汇卡片布局 */}
              {bookType === "vocabulary" && (
                <div className="space-y-2">
                  {/* 第一列：单词 */}
                  <div data-field="primary" onMouseUp={() => handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <h3 className={getFieldStyleClass("primary") || "text-3xl font-bold text-primary"}>
                      {renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </h3>
                  </div>
                  {/* 第二列：释义 */}
                  {card.contentSecondary && (
                    <div data-field="secondary" onMouseUp={() => handleTextSelect(card.id, "secondary", card.contentSecondary || "")}>
                      <p className={getFieldStyleClass("secondary") || "text-xl text-muted-foreground"}>
                        {renderHighlightedText(card.contentSecondary, card.id, "secondary")}
                      </p>
                    </div>
                  )}
                  {/* 第三列：用法解释 */}
                  {card.usageNote && (
                    <div data-field="usageNote" onMouseUp={() => handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className={getFieldStyleClass("usageNote") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.usageNote, card.id, "usageNote")}
                      </p>
                    </div>
                  )}
                  {/* 第四列：例句英文 */}
                  {card.exampleEn && (
                    <div data-field="exampleEn" onMouseUp={() => handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className={getFieldStyleClass("exampleEn") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.exampleEn, card.id, "exampleEn")}
                      </p>
                    </div>
                  )}
                  {/* 第五列：例句中文 */}
                  {card.exampleZh && (
                    <div data-field="exampleZh" onMouseUp={() => handleTextSelect(card.id, "exampleZh", card.exampleZh || "")}>
                      <p className={getFieldStyleClass("exampleZh") || "text-sm text-muted-foreground"}>
                        {renderHighlightedText(card.exampleZh, card.id, "exampleZh")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 句型卡片布局 */}
              {bookType === "sentence" && (
                <div className="space-y-2">
                  {/* 第一列：句型模板 */}
                  <div data-field="primary" onMouseUp={() => handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <p className={getFieldStyleClass("primary") || "text-2xl font-bold text-primary"}>
                      {renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </p>
                  </div>
                  {/* 第二列：中文句型 */}
                  {card.contentSecondary && (
                    <div data-field="secondary" onMouseUp={() => handleTextSelect(card.id, "secondary", card.contentSecondary || "")}>
                      <p className={getFieldStyleClass("secondary") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.contentSecondary, card.id, "secondary")}
                      </p>
                    </div>
                  )}
                  {/* 第三列：用法说明 */}
                  {card.usageNote && (
                    <div data-field="usageNote" onMouseUp={() => handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className={getFieldStyleClass("usageNote") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.usageNote, card.id, "usageNote")}
                      </p>
                    </div>
                  )}
                  {/* 第四列：例句英文 */}
                  {card.exampleEn && (
                    <div data-field="exampleEn" onMouseUp={() => handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className={getFieldStyleClass("exampleEn") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.exampleEn, card.id, "exampleEn")}
                      </p>
                    </div>
                  )}
                  {/* 第五列：例句中文 */}
                  {card.exampleZh && (
                    <div data-field="exampleZh" onMouseUp={() => handleTextSelect(card.id, "exampleZh", card.exampleZh || "")}>
                      <p className={getFieldStyleClass("exampleZh") || "text-sm text-muted-foreground"}>
                        {renderHighlightedText(card.exampleZh, card.id, "exampleZh")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 语料卡片布局 */}
              {bookType === "corpus" && (
                <div className="space-y-2">
                  {/* 第一列：问题 */}
                  <div data-field="primary" onMouseUp={() => handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <p className={getFieldStyleClass("primary") || "text-xl font-bold text-primary"}>
                      {renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </p>
                  </div>
                  {/* 第二列：正式英文 */}
                  {card.contentSecondary && (
                    <div data-field="secondary" onMouseUp={() => handleTextSelect(card.id, "secondary", card.contentSecondary || "")}>
                      <p className={getFieldStyleClass("secondary") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.contentSecondary, card.id, "secondary")}
                      </p>
                    </div>
                  )}
                  {/* 第三列：正式中文 */}
                  {card.usageNote && (
                    <div data-field="usageNote" onMouseUp={() => handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className={getFieldStyleClass("usageNote") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.usageNote, card.id, "usageNote")}
                      </p>
                    </div>
                  )}
                  {/* 第四列：口语英文 */}
                  {card.exampleEn && (
                    <div data-field="exampleEn" onMouseUp={() => handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className={getFieldStyleClass("exampleEn") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.exampleEn, card.id, "exampleEn")}
                      </p>
                    </div>
                  )}
                  {/* 第五列：口语中文 */}
                  {card.exampleZh && (
                    <div data-field="exampleZh" onMouseUp={() => handleTextSelect(card.id, "exampleZh", card.exampleZh || "")}>
                      <p className={getFieldStyleClass("exampleZh") || "text-sm text-muted-foreground"}>
                        {renderHighlightedText(card.exampleZh, card.id, "exampleZh")}
                      </p>
                    </div>
                  )}
                  {/* 第六列：分析 */}
                  {card.analysis && (
                    <div data-field="analysis" onMouseUp={() => handleTextSelect(card.id, "analysis", card.analysis || "")}>
                      <p className={getFieldStyleClass("analysis") || "text-base text-muted-foreground"}>
                        {renderHighlightedText(card.analysis, card.id, "analysis")}
                      </p>
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
