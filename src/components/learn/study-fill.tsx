"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Volume2, Heart, Check, X, Eye, EyeOff } from "lucide-react"

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

interface StudyFillProps {
  cards: Card[]
  bookType: string
  annotations: Record<string, Annotation[]>
  fillModeCards: Record<string, { input: string; checked: boolean; isCorrect: boolean | null }>
  setFillModeCards: React.Dispatch<React.SetStateAction<Record<string, { input: string; checked: boolean; isCorrect: boolean | null }>>>
}

export function StudyFill({ cards, bookType, annotations, fillModeCards, setFillModeCards }: StudyFillProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({})

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

  // 获取卡片中有高亮的字段
  const getHighlightedFields = (cardId: string) => {
    const cardAnnotations = annotations[cardId] || []
    // 只返回有高亮的字段
    const fieldsWithHighlights = new Set<string>()
    cardAnnotations.forEach((a: Annotation) => {
      if (a.highlight) {
        fieldsWithHighlights.add(a.field)
      }
    })
    return Array.from(fieldsWithHighlights)
  }

  // 渲染挖空文本
  const renderFillInText = (text: string, cardId: string, field: string) => {
    const cardAnnotations = annotations[cardId] || []
    const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field && a.highlight)
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
    const cardState = fillModeCards[cardId]
    const isShowAnswer = showAnswers[cardId]

    validAnnotations.forEach((ann: Annotation, index: number) => {
      if (ann.startOffset < lastEnd) return

      if (ann.startOffset > lastEnd) {
        parts.push(<span key={`text-${field}-${index}`}>{text.slice(lastEnd, ann.startOffset)}</span>)
      }

      // 获取正确答案
      const answer = text.slice(ann.startOffset, ann.endOffset)
      const userInput = cardState?.input || ""
      const isChecked = cardState?.checked || false

      // 挖空区域
      let fillContent: React.ReactNode

      if (isShowAnswer) {
        // 显示答案
        fillContent = (
          <span className="inline-block min-w-[60px] px-2 py-0.5 bg-green-100 text-green-800 rounded border border-green-300 font-medium">
            {answer}
          </span>
        )
      } else if (isChecked) {
        // 已检查
        const isCorrect = cardState.isCorrect
        fillContent = (
          <span className={`inline-block min-w-[60px] px-2 py-0.5 rounded border font-medium ${
          isCorrect
            ? "bg-green-100 text-green-800 border-green-300"
            : "bg-red-100 text-red-800 border-red-300"
          }`}>
            {answer}
          </span>
        )
      } else {
        // 输入框
        fillContent = (
          <input
            type="text"
            className="inline-block min-w-[80px] px-2 py-0.5 border-b-2 border-amber-400 bg-transparent focus:outline-none focus:border-amber-600"
            placeholder="?"
            value={userInput}
            onChange={(e) => {
              setFillModeCards(prev => ({
                ...prev,
                [cardId]: { ...prev[cardId], input: e.target.value, checked: false, isCorrect: null }
              }))
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                checkAnswer(cardId, answer)
              }
            }}
          />
        )
      }

      parts.push(
        <span key={`fill-${field}-${index}`} className="relative">
          {fillContent}
        </span>
      )

      lastEnd = ann.endOffset
    })

    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.slice(lastEnd)}</span>)
    }

    return parts
  }

  // 检查答案
  const checkAnswer = (cardId: string, answer: string) => {
    const cardState = fillModeCards[cardId]
    if (!cardState) return

    const userInput = cardState.input.trim().toLowerCase()
    const correctAnswer = answer.trim().toLowerCase()
    const isCorrect = userInput === correctAnswer

    setFillModeCards(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], checked: true, isCorrect }
    }))
  }

  // 切换显示答案
  const toggleShowAnswer = (cardId: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // 重置卡片状态
  const resetCard = (cardId: string) => {
    setFillModeCards(prev => ({
      ...prev,
      [cardId]: { input: "", checked: false, isCorrect: null }
    }))
    setShowAnswers(prev => ({
      ...prev,
      [cardId]: false
    }))
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
        const highlightedFields = getHighlightedFields(card.id)
        const cardState = fillModeCards[card.id]
        const isChecked = cardState?.checked || false

        // 如果没有高亮，显示提示
        if (highlightedFields.length === 0) {
          return (
            <Card key={card.id} className="break-inside-avoid opacity-60">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="text-sm text-muted-foreground">请先添加高亮</span>
                </div>
              </CardHeader>
              <CardContent className="py-2 text-center text-muted-foreground">
                <p>此卡片暂无高亮区域，请先在"单张卡片"或"全部展示"模式下添加高亮</p>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card key={card.id} className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{index + 1}</Badge>
                {isChecked && (
                  cardState.isCorrect ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <Check className="h-3 w-3 mr-1" /> 正确
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-300">
                      <X className="h-3 w-3 mr-1" /> 错误
                    </Badge>
                  )
                )}
              </div>
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
            <CardContent className="py-2 space-y-3">
              {/* 词汇卡片布局 */}
              {bookType === "vocabulary" && (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-primary mb-1" data-field="primary">
                      {highlightedFields.includes("primary")
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : card.contentPrimary}
                    </h3>
                    <p className="text-lg text-muted-foreground">{card.contentSecondary}</p>
                  </div>
                  {card.usageNote && (
                    <div className="p-2 bg-muted/50 rounded-lg" data-field="usageNote">
                      <p className="text-sm">
                        {highlightedFields.includes("usageNote")
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : card.usageNote}
                      </p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="border-l-4 border-primary pl-3" data-field="exampleEn">
                      <p className="text-sm italic">
                        {highlightedFields.includes("exampleEn")
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : card.exampleEn}
                      </p>
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
                  <div className="p-3 bg-primary/5 rounded-xl border" data-field="primary">
                    <p className="text-xl font-semibold text-primary">
                      {highlightedFields.includes("primary")
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : card.contentPrimary}
                    </p>
                    {card.contentSecondary && (
                      <p className="text-sm text-muted-foreground mt-1">{card.contentSecondary}</p>
                    )}
                  </div>
                  {card.usageNote && (
                    <div className="space-y-1" data-field="usageNote">
                      <p className="text-xs font-medium">用法说明</p>
                      <p className="text-sm text-muted-foreground">
                        {highlightedFields.includes("usageNote")
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : card.usageNote}
                      </p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="space-y-1" data-field="exampleEn">
                      <p className="text-xs font-medium">例句</p>
                      <p className="text-sm italic border-l-2 pl-2 border-primary">
                        {highlightedFields.includes("exampleEn")
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : card.exampleEn}
                      </p>
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
                  <div className="text-center py-1" data-field="primary">
                    <p className="text-base">
                      {highlightedFields.includes("primary")
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : card.contentPrimary}
                    </p>
                    {card.contentSecondary && (
                      <p className="text-sm text-muted-foreground">{card.contentSecondary}</p>
                    )}
                  </div>
                  {card.usageNote && (
                    <div className="p-2 bg-muted/50 rounded-lg" data-field="usageNote">
                      <p className="text-xs font-medium">要点</p>
                      <p className="text-sm text-muted-foreground">
                        {highlightedFields.includes("usageNote")
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : card.usageNote}
                      </p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="space-y-1" data-field="exampleEn">
                      <p className="text-xs font-medium">示例</p>
                      <p className="text-sm">
                        {highlightedFields.includes("exampleEn")
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : card.exampleEn}
                      </p>
                      {card.exampleZh && (
                        <p className="text-xs text-muted-foreground">{card.exampleZh}</p>
                      )}
                    </div>
                  )}
                  {card.analysis && (
                    <div className="p-2 bg-primary/5 rounded-lg" data-field="analysis">
                      <p className="text-xs font-medium">分析</p>
                      <p className="text-xs text-muted-foreground">
                        {highlightedFields.includes("analysis")
                          ? renderFillInText(card.analysis, card.id, "analysis")
                          : card.analysis}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleShowAnswer(card.id)}
                >
                  {showAnswers[card.id] ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" /> 隐藏答案
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" /> 查看答案
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetCard(card.id)}
                >
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
