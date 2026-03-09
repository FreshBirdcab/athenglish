"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Volume2, Heart, Check, X, Eye, EyeOff, PenLine } from "lucide-react"

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

interface StudyFillProps {
  cards: Card[]
  bookType: string
  annotations: Record<string, Annotation[]>
  fillModeCards: Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>
  setFillModeCards: React.Dispatch<React.SetStateAction<Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>>
  fieldStyles?: Record<string, FieldStyle> | null
  // 答题历史相关
  fillAnswerHistory: Record<string, { correct: number; incorrect: number }>
  setFillAnswerHistory: React.Dispatch<React.SetStateAction<Record<string, { correct: number; incorrect: number }>>>
  saveFillAnswerHistory: (cardId: string, correct: number, incorrect: number) => void
}

interface FillState {
  input: string
  checked: boolean
  isCorrect: boolean | null
}

export function StudyFill({ cards, bookType, annotations, fillModeCards, setFillModeCards, fieldStyles, fillAnswerHistory, setFillAnswerHistory, saveFillAnswerHistory }: StudyFillProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({})
  // 用于跟踪本轮已计数的卡片，避免重复计数
  const countedCardsRef = useRef<Set<string>>(new Set())
  // 用于标记是否刚刚重置过
  const justResetRef = useRef(false)

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

  // 监听答题状态变化，更新历史记录并保存到服务器
  useEffect(() => {
    if (!cards.length) return

    cards.forEach(card => {
      const cardState = fillModeCards[card.id]
      if (!cardState) return

      // 获取该卡片的挖空数量
      const cardAnnotations = annotations[card.id] || []
      const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
      const totalFills = highlightAnnotations.length

      if (totalFills === 0) return

      const answeredCount = Object.values(cardState).filter((s: any) => s.checked).length

      // 只有当所有挖空都回答了才更新历史
      if (answeredCount === totalFills) {
        // 如果刚刚重置过，清除标记和计数记录，允许重新计数
        if (justResetRef.current) {
          justResetRef.current = false
          countedCardsRef.current.delete(card.id)
        }

        // 检查是否已在本轮计数过
        if (countedCardsRef.current.has(card.id)) {
          return
        }

        const allCorrect = Object.values(cardState).every((s: any) => s.isCorrect === true)

        // 标记该卡片已计数
        countedCardsRef.current.add(card.id)

        // 每次所有挖空都回答完就累加计数
        setFillAnswerHistory(prev => {
          const history = prev[card.id] || { correct: 0, incorrect: 0 }
          const newHistory = {
            correct: history.correct + (allCorrect ? 1 : 0),
            incorrect: history.incorrect + (allCorrect ? 0 : 1)
          }
          // 保存到服务器
          saveFillAnswerHistory(card.id, newHistory.correct, newHistory.incorrect)
          return {
            ...prev,
            [card.id]: newHistory
          }
        })
      }
    })
  }, [fillModeCards, cards, annotations, setFillAnswerHistory, saveFillAnswerHistory])

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

  // 获取卡片中有高亮的字段和位置
  const getHighlightedAnnotations = (cardId: string) => {
    const cardAnnotations = annotations[cardId] || []
    // 只返回有高亮的批注
    return cardAnnotations.filter((a: Annotation) => a.highlight)
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
    const cardState = fillModeCards[cardId] || {}
    const isShowAnswer = showAnswers[cardId]

    validAnnotations.forEach((ann: Annotation, index: number) => {
      if (ann.startOffset < lastEnd) return

      if (ann.startOffset > lastEnd) {
        parts.push(<span key={`text-${field}-${index}`}>{text.slice(lastEnd, ann.startOffset)}</span>)
      }

      // 获取正确答案
      const answer = text.slice(ann.startOffset, ann.endOffset)
      const fieldState = cardState[index] || { input: "", checked: false, isCorrect: null }
      const userInput = fieldState.input
      const isChecked = fieldState.checked
      const fieldIsCorrect = fieldState.isCorrect

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
        fillContent = (
          <span className={`inline-block min-w-[60px] px-2 py-0.5 rounded border font-medium ${
            fieldIsCorrect
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
              const newValue = e.target.value
              setFillModeCards(prev => {
                const cardState = prev[cardId] || {}
                const newCardState = {
                  ...cardState,
                  [index]: { input: newValue, checked: false, isCorrect: null }
                }

                // 检查该卡片所有挖空是否都有输入，如果有则自动检查答案
                const cardAnnotations = annotations[cardId] || []
                const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
                const totalFills = highlightAnnotations.length

                // 检查是否所有挖空都有输入
                let allFilled = true
                for (let i = 0; i < totalFills; i++) {
                  const state = newCardState[i]
                  if (!state || !state.input.trim()) {
                    allFilled = false
                    break
                  }
                }

                // 如果所有挖空都有输入，自动检查答案
                if (allFilled) {
                  const card = cards.find(c => c.id === cardId)
                  if (card) {
                    const fields = ["primary", "secondary", "usageNote", "exampleEn", "exampleZh", "analysis"]
                    const fieldAnnotations: { field: string; annotations: Annotation[] }[] = []
                    fields.forEach(field => {
                      const fieldAnns = cardAnnotations.filter((a: Annotation) => a.field === field && a.highlight)
                      if (fieldAnns.length > 0) {
                        fieldAnnotations.push({ field, annotations: fieldAnns })
                      }
                    })

                    fieldAnnotations.forEach(({ annotations: anns }) => {
                      const sorted = [...anns].sort((a, b) => a.startOffset - b.startOffset)
                      sorted.forEach((ann, idx) => {
                        const fieldState = newCardState[idx]
                        if (fieldState && fieldState.input.trim()) {
                          let fieldText = ""
                          if (ann.field === "primary") fieldText = card.contentPrimary
                          else if (ann.field === "secondary") fieldText = card.contentSecondary || ""
                          else if (ann.field === "usageNote") fieldText = card.usageNote || ""
                          else if (ann.field === "exampleEn") fieldText = card.exampleEn || ""
                          else if (ann.field === "exampleZh") fieldText = card.exampleZh || ""
                          else if (ann.field === "analysis") fieldText = card.analysis || ""

                          const correctAnswer = fieldText.slice(ann.startOffset, ann.endOffset).trim().toLowerCase()
                          const userInput = fieldState.input.trim().toLowerCase()
                          const isCorrect = userInput === correctAnswer

                          newCardState[idx] = { ...fieldState, checked: true, isCorrect }
                        }
                      })
                    })
                  }
                }

                return {
                  ...prev,
                  [cardId]: newCardState
                }
              })
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                checkAnswer(cardId, index, answer)
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
  const checkAnswer = (cardId: string, index: number, answer: string) => {
    const cardState = fillModeCards[cardId] || {}
    const fieldState = cardState[index]
    if (!fieldState) return

    const userInput = fieldState.input.trim().toLowerCase()
    const correctAnswer = answer.trim().toLowerCase()
    const isCorrect = userInput === correctAnswer

    setFillModeCards(prev => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || {}),
        [index]: { ...fieldState, checked: true, isCorrect }
      }
    }))
  }

  // 切换显示答案
  const toggleShowAnswer = (cardId: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // 检查卡片所有答案
  const checkAllAnswers = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    const cardAnnotations = annotations[cardId] || []
    const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
    if (highlightAnnotations.length === 0) return

    // 获取有高亮的字段
    const fields = ["primary", "secondary", "usageNote", "exampleEn", "exampleZh", "analysis"]
    const fieldAnnotations: { field: string; annotations: Annotation[] }[] = []
    fields.forEach(field => {
      const fieldAnns = cardAnnotations.filter((a: Annotation) => a.field === field && a.highlight)
      if (fieldAnns.length > 0) {
        fieldAnnotations.push({ field, annotations: fieldAnns })
      }
    })

    // 检查每个字段的答案
    setFillModeCards(prev => {
      const cardState = { ...(prev[cardId] || {}) }
      let hasChanges = false

      fieldAnnotations.forEach(({ field, annotations: anns }) => {
        const sorted = [...anns].sort((a, b) => a.startOffset - b.startOffset)
        let lastEnd = 0

        sorted.forEach((ann, idx) => {
          if (ann.startOffset >= lastEnd) {
            const fieldState = cardState[idx]
            if (fieldState && fieldState.input.trim()) {
              let fieldText = ""
              if (field === "primary") fieldText = card.contentPrimary
              else if (field === "secondary") fieldText = card.contentSecondary || ""
              else if (field === "usageNote") fieldText = card.usageNote || ""
              else if (field === "exampleEn") fieldText = card.exampleEn || ""
              else if (field === "exampleZh") fieldText = card.exampleZh || ""
              else if (field === "analysis") fieldText = card.analysis || ""

              const correctAnswer = fieldText.slice(ann.startOffset, ann.endOffset).trim().toLowerCase()
              const userInput = fieldState.input.trim().toLowerCase()
              const isCorrect = userInput === correctAnswer

              if (!fieldState.checked || fieldState.isCorrect !== isCorrect) {
                cardState[idx] = { ...fieldState, checked: true, isCorrect }
                hasChanges = true
              }
              lastEnd = ann.endOffset
            }
          }
        })
      })

      if (!hasChanges) return prev

      return {
        ...prev,
        [cardId]: cardState
      }
    })
  }

  // 重置卡片状态
  const resetCard = (cardId: string) => {
    // 标记刚刚重置过
    justResetRef.current = true
    // 清空挖空内容
    setFillModeCards(prev => {
      const cardData = prev[cardId]
      if (!cardData) return prev
      const resetData: Record<number, { input: string; checked: boolean; isCorrect: boolean | null }> = {}
      Object.keys(cardData).forEach(key => {
        const idx = parseInt(key)
        resetData[idx] = {
          input: "",
          checked: false,
          isCorrect: null
        }
      })
      return { ...prev, [cardId]: resetData }
    })
    setShowAnswers(prev => {
      const newState = { ...prev }
      delete newState[cardId]
      return newState
    })
  }

  // 检查卡片是否有答案
  const checkCardAnswers = (cardId: string, text: string) => {
    const cardAnnotations = annotations[cardId] || []
    const annotationsWithHighlight = cardAnnotations.filter((a: Annotation) => a.highlight)
    if (annotationsWithHighlight.length === 0) return

    // 收集每个字段的高亮
    const fieldAnnotations: { field: string; annotations: Annotation[] }[] = []
    const fields = ["primary", "secondary", "usageNote", "exampleEn", "exampleZh", "analysis"]
    fields.forEach(field => {
      const fieldAnns = cardAnnotations.filter((a: Annotation) => a.field === field && a.highlight)
      if (fieldAnns.length > 0) {
        fieldAnnotations.push({ field, annotations: fieldAnns })
      }
    })

    // 先检查所有答案，更新状态
    setFillModeCards(prev => {
      let newState = { ...prev }
      const cardState = prev[cardId] || {}

      // 检查每个高亮
      fieldAnnotations.forEach(({ annotations: anns }) => {
        const sorted = [...anns].sort((a, b) => a.startOffset - b.startOffset)
        let lastEnd = 0
        sorted.forEach((ann, idx) => {
          if (ann.startOffset >= lastEnd) {
            const fieldState = cardState[idx]
            if (fieldState && fieldState.input.trim()) {
              // 获取原文来验证
              let fieldText = ""
              if (ann.field === "primary") fieldText = cards.find(c => c.id === cardId)?.contentPrimary || ""
              else if (ann.field === "secondary") fieldText = cards.find(c => c.id === cardId)?.contentSecondary || ""
              else if (ann.field === "usageNote") fieldText = cards.find(c => c.id === cardId)?.usageNote || ""
              else if (ann.field === "exampleEn") fieldText = cards.find(c => c.id === cardId)?.exampleEn || ""
              else if (ann.field === "exampleZh") fieldText = cards.find(c => c.id === cardId)?.exampleZh || ""
              else if (ann.field === "analysis") fieldText = cards.find(c => c.id === cardId)?.analysis || ""

              const correctAnswer = fieldText.slice(ann.startOffset, ann.endOffset).trim().toLowerCase()
              const userInput = fieldState.input.trim().toLowerCase()
              const isCorrect = userInput === correctAnswer

              cardState[idx] = { ...fieldState, checked: true, isCorrect }
              lastEnd = ann.endOffset
            }
          }
        })
      })

      newState[cardId] = cardState

      return newState
    })
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
        const highlightedAnnotations = getHighlightedAnnotations(card.id)
        const cardState = fillModeCards[card.id] || {}
        const hasAnyChecked = Object.values(cardState).some(s => s.checked)
        const allCorrect = Object.values(cardState).every(s => !s.input || s.isCorrect)
        const isShowAnswer = showAnswers[card.id]

        // 如果没有高亮，显示提示
        if (highlightedAnnotations.length === 0) {
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

        // 获取有高亮的字段
        const fieldsWithHighlights = new Set<string>()
        highlightedAnnotations.forEach((a: Annotation) => fieldsWithHighlights.add(a.field))

        return (
          <Card key={card.id} className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              {/* 左侧：序号和答题历史 */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-0.5 h-8">#{index + 1}</Badge>
                {/* 显示答题历史 */}
                {fillAnswerHistory[card.id] && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600 font-medium">✓{fillAnswerHistory[card.id].correct}</span>
                    <span className="text-red-500 font-medium">✗{fillAnswerHistory[card.id].incorrect}</span>
                  </div>
                )}
              </div>

              {/* 右侧：操作按钮组 */}
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(card.id)}
                  className={`h-8 w-8 ${isFavorited ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                  title={isFavorited ? "取消收藏" : "收藏"}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speak(card.contentPrimary)}
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  title="朗读"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              {/* 词汇卡片布局 */}
              {bookType === "vocabulary" && (
                <div className="space-y-2">
                  {/* 第一列：单词 */}
                  <div data-field="primary">
                    <h3 className="text-2xl font-bold text-primary">
                      {fieldsWithHighlights.has("primary")
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : card.contentPrimary}
                    </h3>
                  </div>
                  {/* 第二列：释义 */}
                  {card.contentSecondary && (
                    <div data-field="secondary" className="text-muted-foreground">
                      <p className="text-lg">
                        {fieldsWithHighlights.has("secondary")
                          ? renderFillInText(card.contentSecondary, card.id, "secondary")
                          : card.contentSecondary}
                      </p>
                    </div>
                  )}
                  {/* 第三列：用法解释 */}
                  {card.usageNote && (
                    <div data-field="usageNote" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("usageNote")
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : card.usageNote}
                      </p>
                    </div>
                  )}
                  {/* 第四列：例句英文 */}
                  {card.exampleEn && (
                    <div data-field="exampleEn" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("exampleEn")
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : card.exampleEn}
                      </p>
                    </div>
                  )}
                  {/* 第五列：例句中文 */}
                  {card.exampleZh && (
                    <div data-field="exampleZh" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("exampleZh")
                          ? renderFillInText(card.exampleZh, card.id, "exampleZh")
                          : card.exampleZh}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 句型卡片布局 */}
              {bookType === "sentence" && (
                <div className="space-y-2">
                  {/* 第一列：句型模板 */}
                  <div data-field="primary">
                    <p className="text-xl font-bold text-primary">
                      {fieldsWithHighlights.has("primary")
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : card.contentPrimary}
                    </p>
                  </div>
                  {/* 第二列：中文翻译 */}
                  {card.contentSecondary && (
                    <div data-field="secondary" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("secondary")
                          ? renderFillInText(card.contentSecondary, card.id, "secondary")
                          : card.contentSecondary}
                      </p>
                    </div>
                  )}
                  {/* 第三列：用法说明 */}
                  {card.usageNote && (
                    <div data-field="usageNote" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("usageNote")
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : card.usageNote}
                      </p>
                    </div>
                  )}
                  {/* 第四列：例句英文 */}
                  {card.exampleEn && (
                    <div data-field="exampleEn" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("exampleEn")
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : card.exampleEn}
                      </p>
                    </div>
                  )}
                  {/* 第五列：例句中文 */}
                  {card.exampleZh && (
                    <div data-field="exampleZh" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("exampleZh")
                          ? renderFillInText(card.exampleZh, card.id, "exampleZh")
                          : card.exampleZh}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 语料卡片布局 */}
              {bookType === "corpus" && (
                <div className="space-y-2">
                  {/* 第一列：问题 */}
                  <div data-field="primary">
                    <p className="text-lg font-bold text-primary">
                      {fieldsWithHighlights.has("primary")
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : card.contentPrimary}
                    </p>
                  </div>
                  {/* 第二列：正式英文回答 */}
                  {card.contentSecondary && (
                    <div data-field="secondary" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("secondary")
                          ? renderFillInText(card.contentSecondary, card.id, "secondary")
                          : card.contentSecondary}
                      </p>
                    </div>
                  )}
                  {/* 第三列：正式中文回答 */}
                  {card.usageNote && (
                    <div data-field="usageNote" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("usageNote")
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : card.usageNote}
                      </p>
                    </div>
                  )}
                  {/* 第四列：口语英文回答 */}
                  {card.exampleEn && (
                    <div data-field="exampleEn" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("exampleEn")
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : card.exampleEn}
                      </p>
                    </div>
                  )}
                  {/* 第五列：口语中文回答 */}
                  {card.exampleZh && (
                    <div data-field="exampleZh" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("exampleZh")
                          ? renderFillInText(card.exampleZh, card.id, "exampleZh")
                          : card.exampleZh}
                      </p>
                    </div>
                  )}
                  {/* 第六列：分析 */}
                  {card.analysis && (
                    <div data-field="analysis" className="text-muted-foreground">
                      <p className="text-sm">
                        {fieldsWithHighlights.has("analysis")
                          ? renderFillInText(card.analysis, card.id, "analysis")
                          : card.analysis}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 - 每个卡片内部 */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleShowAnswer(card.id)}
                >
                  {isShowAnswer ? (
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
