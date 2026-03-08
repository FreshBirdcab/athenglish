"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Heart, PenLine, Eye, EyeOff, X, Check } from "lucide-react"

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
  // 挖空模式相关
  activeFillCardId: string | null
  setActiveFillCardId: (id: string | null) => void
  fillModeCards: Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>
  setFillModeCards: React.Dispatch<React.SetStateAction<Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>>
  fillAnswerHistory: Record<string, { correct: number; incorrect: number }>
  setFillAnswerHistory: React.Dispatch<React.SetStateAction<Record<string, { correct: number; incorrect: number }>>>
}

export function StudyList({ cards, bookType, annotations, onTextSelect, onDeleteAnnotation, onHighlightClick, activeFillCardId, setActiveFillCardId, fillModeCards, setFillModeCards, fillAnswerHistory, setFillAnswerHistory }: StudyListProps) {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<string[]>([])
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({})
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

  // 监听答题状态变化，更新历史记录
  useEffect(() => {
    if (!activeFillCardId) return

    const cardState = fillModeCards[activeFillCardId]
    if (!cardState) return

    // 获取该卡片的挖空数量
    const cardAnnotations = annotations[activeFillCardId] || []
    const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
    const totalFills = highlightAnnotations.length

    if (totalFills === 0) return

    const answeredCount = Object.values(cardState).filter((s: any) => s.checked).length

    // 只有当所有挖空都回答了才更新历史
    if (answeredCount === totalFills) {
      const allCorrect = Object.values(cardState).every((s: any) => s.isCorrect === true)

      // 检查是否已经在历史中记录过这一轮
      const currentHistory = fillAnswerHistory[activeFillCardId] || { correct: 0, incorrect: 0 }
      // 如果已经有记录，说明这一轮已经处理过了，跳过
      if (currentHistory.correct > 0 || currentHistory.incorrect > 0) {
        return
      }

      setFillAnswerHistory(prev => {
        const history = prev[activeFillCardId] || { correct: 0, incorrect: 0 }
        return {
          ...prev,
          [activeFillCardId]: {
            correct: history.correct + (allCorrect ? 1 : 0),
            incorrect: history.incorrect + (allCorrect ? 0 : 1)
          }
        }
      })
    }
  }, [fillModeCards, activeFillCardId, annotations])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // q键：进入/退出挖空模式
      if (e.key === "q" || e.key === "Q") {
        if (isInput) return // 在输入框中禁用
        e.preventDefault()
        if (activeFillCardId) {
          setActiveFillCardId(null)
        } else if (cards.length > 0) {
          // 默认进入第一张卡片的挖空模式
          setActiveFillCardId(cards[0].id)
          setShowAnswers(prev => ({ ...prev, [cards[0].id]: false }))
          // 聚焦到第一个挖空输入框
          setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-card-id="${cards[0].id}"]`)
            const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === '0') as HTMLInputElement
            if (input) input.focus()
          }, 100)
        }
        return
      }

      // e键：切换显示答案（当前激活的卡片）
      if ((e.key === "e" || e.key === "E") && activeFillCardId) {
        if (isInput) return // 在输入框中禁用
        e.preventDefault()
        setShowAnswers(prev => ({
          ...prev,
          [activeFillCardId]: !prev[activeFillCardId]
        }))
        return
      }

      // x键：重置挖空内容
      if ((e.key === "x" || e.key === "X") && activeFillCardId) {
        if (isInput) return // 在输入框中禁用
        e.preventDefault()
        setFillModeCards(prev => {
          const newState = { ...prev }
          delete newState[activeFillCardId]
          return newState
        })
        setShowAnswers(prev => {
          const newState = { ...prev }
          delete newState[activeFillCardId]
          return newState
        })
        // 聚焦到第一个挖空输入框
        setTimeout(() => {
          const inputs = document.querySelectorAll(`[data-card-id="${activeFillCardId}"]`)
          const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === '0') as HTMLInputElement
          if (input) input.focus()
        }, 100)
        return
      }

      // 回车键：提交当前答案并跳转到下一个挖空
      if (e.key === "Enter" && isInput && activeFillCardId) {
        e.preventDefault()
        const cardId = activeFillCardId
        const card = cards.find(c => c.id === cardId)
        if (!card) return

        // 获取当前卡片的所有挖空数量
        const cardAnnotations = annotations[cardId] || []
        const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
        const fillCount = highlightAnnotations.length

        // 获取当前聚焦的输入框索引
        const currentInput = document.activeElement as HTMLInputElement
        const currentIndexAttr = currentInput?.dataset?.fillIndex
        const currentIndex = currentIndexAttr ? parseInt(currentIndexAttr) : 0

        // 提交当前答案
        const cardState = fillModeCards[cardId] || {}
        const currentFieldState = cardState[currentIndex]
        if (currentFieldState && currentFieldState.input.trim()) {
          let fieldText = ""
          const validAnnotations = highlightAnnotations.filter((a: Annotation) => a.field)
          if (validAnnotations.length > 0) {
            const sorted = [...validAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)
            const currentAnn = sorted[currentIndex]
            if (currentAnn) {
              if (currentAnn.field === "primary") fieldText = card.contentPrimary
              else if (currentAnn.field === "usageNote") fieldText = card.usageNote || ""
              else if (currentAnn.field === "exampleEn") fieldText = card.exampleEn || ""
              else if (currentAnn.field === "analysis") fieldText = card.analysis || ""

              const answer = fieldText.slice(currentAnn.startOffset, currentAnn.endOffset).trim().toLowerCase()
              const isCorrect = currentFieldState.input.trim().toLowerCase() === answer

              setFillModeCards(prev => {
                const newState = {
                  ...prev,
                  [cardId]: {
                    ...prev[cardId],
                    [currentIndex]: { ...currentFieldState, checked: true, isCorrect }
                  }
                }

                return newState
              })
            }
          }
        }

        // 跳转到下一个挖空
        const nextIndex = (currentIndex + 1) % fillCount

        // 延迟聚焦到下一个输入框
        setTimeout(() => {
          const inputs = document.querySelectorAll(`[data-card-id="${cardId}"]`)
          const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === String(nextIndex)) as HTMLInputElement
          if (input) {
            input.focus()
          }
        }, 100)
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeFillCardId, cards, annotations, fillModeCards, setFillModeCards, setFillAnswerHistory])

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

  // 渲染挖空文本 (卡片级)
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

      const answer = text.slice(ann.startOffset, ann.endOffset)
      const fieldState = cardState[index] || { input: "", checked: false, isCorrect: null }
      const userInput = fieldState.input
      const isChecked = fieldState.checked

      let fillContent: React.ReactNode

      if (isShowAnswer) {
        fillContent = (
          <span className="inline-block min-w-[60px] px-2 py-0.5 bg-green-100 text-green-800 rounded border border-green-300 font-medium animate-scale-in">
            {answer}
          </span>
        )
      } else if (isChecked) {
        fillContent = (
          <span className={`inline-block min-w-[60px] px-2 py-0.5 rounded border font-medium animate-scale-in ${
            fieldState.isCorrect
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-red-100 text-red-800 border-red-300"
          }`}>
            {answer}
          </span>
        )
      } else {
        fillContent = (
          <input
            type="text"
            data-card-id={cardId}
            data-fill-index={index}
            className="inline-block min-w-[80px] px-2 py-0.5 border-b-2 border-amber-400 bg-transparent focus:outline-none focus:border-amber-600"
            placeholder="?"
            value={userInput}
            onChange={(e) => {
              setFillModeCards(prev => ({
                ...prev,
                [cardId]: {
                  ...(prev[cardId] || {}),
                  [index]: { input: e.target.value, checked: false, isCorrect: null }
                }
              }))
            }}
            onFocus={() => {
              // 更新当前聚焦的挖空索引
              setShowAnswers(prev => ({ ...prev, [cardId]: false }))
            }}
          />
        )
      }

      parts.push(<span key={`fill-${field}-${index}`} className="relative">{fillContent}</span>)

      lastEnd = ann.endOffset
    })

    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.slice(lastEnd)}</span>)
    }

    return parts
  }

  // 获取卡片中有高亮的字段
  const getHighlightedFields = (cardId: string) => {
    const cardAnnotations = annotations[cardId] || []
    const fieldsWithHighlights = new Set<string>()
    cardAnnotations.forEach((a: Annotation) => {
      if (a.highlight) {
        fieldsWithHighlights.add(a.field)
      }
    })
    return fieldsWithHighlights
  }

  // 重置卡片状态
  const resetFillCard = (cardId: string) => {
    setFillModeCards(prev => {
      const newState = { ...prev }
      delete newState[cardId]
      return newState
    })
    setShowAnswers(prev => {
      const newState = { ...prev }
      delete newState[cardId]
      return newState
    })
    // 清除该卡片的历史记录，允许下次答题时重新计数
    setFillAnswerHistory(prev => {
      const newState = { ...prev }
      delete newState[cardId]
      return newState
    })
  }

  // 切换显示答案
  const toggleShowAnswer = (cardId: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  // 处理文本选择
  const handleTextSelect = (cardId: string, field: string, fieldText: string) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const selectedText = selection.toString().trim()
    if (!selectedText) return

    // 获取 Range 对象
    const range = selection.getRangeAt(0)

    // 统计字段中该文本出现的次数
    const allOccurrences: number[] = []
    let searchPos = 0
    while (true) {
      const pos = fieldText.indexOf(selectedText, searchPos)
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
      const contentElement = contentRefs.current[cardId]
      if (!contentElement) return

      const fieldEl = contentElement.querySelector(`[data-field="${field}"]`)
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

    // 检查是否与已有的高亮重叠
    const existingAnnotations = annotations[cardId] || []
    const fieldAnnotations = existingAnnotations.filter((a: Annotation) => a.field === field && a.highlight)

    let hasOverlap = false
    for (const ann of fieldAnnotations) {
      if (!(start + selectedText.length <= ann.startOffset || start >= ann.endOffset)) {
        hasOverlap = true
        break
      }
    }

    if (hasOverlap) {
      alert("该区域已有高亮，请选择其他区域")
      window.getSelection()?.removeAllRanges()
      return
    }

    // 计算菜单位置
    const rect = range.getBoundingClientRect()

    onTextSelect(cardId, selectedText, start, start + selectedText.length, field, {
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

        const isFillMode = activeFillCardId === card.id
        const fieldsWithHighlights = getHighlightedFields(card.id)
        const cardState = fillModeCards[card.id] || {}
        const hasAnyChecked = Object.values(cardState).some(s => s.checked)
        const allCorrect = Object.values(cardState).every(s => !s.input || s.isCorrect)
        const isShowAnswer = showAnswers[card.id]

        return (
          <Card key={card.id} className="break-inside-avoid">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              {/* 左侧：序号 + 答题统计 */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-0.5 h-8">#{index + 1}</Badge>
                {/* 答题历史累计次数 - 常驻显示 */}
                {(() => {
                  const history = fillAnswerHistory[card.id] || { correct: 0, incorrect: 0 }
                  const totalAnswered = history.correct + history.incorrect
                  if (totalAnswered > 0) {
                    return (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="flex items-center gap-0.5 text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          <Check className="h-3 w-3" />
                          {history.correct}
                        </span>
                        <span className="flex items-center gap-0.5 text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <X className="h-3 w-3" />
                          {history.incorrect}
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              {/* 右侧：操作按钮组 */}
              <div className="flex items-center gap-0.5">
                {/* 挖空模式控制按钮组 */}
                {isFillMode ? (
                  <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1 mr-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShowAnswer(card.id)}
                      className="h-6 text-xs px-1"
                      title={isShowAnswer ? "隐藏答案" : "查看答案"}
                    >
                      {isShowAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <div className="w-px h-4 bg-amber-300" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetFillCard(card.id)}
                      className="h-6 text-xs px-1"
                      title="重置"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="w-px h-4 bg-amber-300" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveFillCardId(null)}
                      className="h-6 text-xs px-1 text-amber-600"
                      title="退出挖空"
                    >
                      <PenLine className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setActiveFillCardId(card.id)
                      setShowAnswers(prev => ({ ...prev, [card.id]: false }))
                      setTimeout(() => {
                        const inputs = document.querySelectorAll(`[data-card-id="${card.id}"]`)
                        const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === '0') as HTMLInputElement
                        if (input) input.focus()
                      }, 100)
                    }}
                    className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                    title="挖空学习"
                  >
                    <PenLine className="h-4 w-4" />
                  </Button>
                )}
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
            <CardContent className="py-2" ref={el => { if (el) contentRefs.current[card.id] = el }}>
              {/* 词汇卡片布局 */}
              {bookType === "vocabulary" && (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-primary mb-1" data-field="primary" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "primary", card.contentPrimary)}>
                      {isFillMode
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </h3>
                    <p className="text-lg text-muted-foreground">{card.contentSecondary}</p>
                  </div>
                  {card.usageNote && (
                    <div className="p-2 bg-muted/50 rounded-lg" data-field="usageNote" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className="text-sm">
                        {isFillMode
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : renderHighlightedText(card.usageNote, card.id, "usageNote")}
                      </p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="border-l-4 border-primary pl-3" data-field="exampleEn" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className="text-sm italic">
                        {isFillMode
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : renderHighlightedText(card.exampleEn, card.id, "exampleEn")}
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
                  <div className="p-3 bg-primary/5 rounded-xl border" data-field="primary" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <p className="text-xl font-semibold text-primary">
                      {isFillMode
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </p>
                    {card.contentSecondary && (
                      <p className="text-sm text-muted-foreground mt-1">{card.contentSecondary}</p>
                    )}
                  </div>
                  {card.usageNote && (
                    <div className="space-y-1" data-field="usageNote" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className="text-xs font-medium">用法说明</p>
                      <p className="text-sm text-muted-foreground">
                        {isFillMode
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : renderHighlightedText(card.usageNote, card.id, "usageNote")}
                      </p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="space-y-1" data-field="exampleEn" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className="text-xs font-medium">例句</p>
                      <p className="text-sm italic border-l-2 pl-2 border-primary">
                        {isFillMode
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : renderHighlightedText(card.exampleEn, card.id, "exampleEn")}
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
                  <div className="text-center py-1" data-field="primary" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "primary", card.contentPrimary)}>
                    <p className="text-base">
                      {isFillMode
                        ? renderFillInText(card.contentPrimary, card.id, "primary")
                        : renderHighlightedText(card.contentPrimary, card.id, "primary")}
                    </p>
                    {card.contentSecondary && (
                      <p className="text-sm text-muted-foreground">{card.contentSecondary}</p>
                    )}
                  </div>
                  {card.usageNote && (
                    <div className="p-2 bg-muted/50 rounded-lg" data-field="usageNote" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "usageNote", card.usageNote || "")}>
                      <p className="text-xs font-medium">要点</p>
                      <p className="text-sm text-muted-foreground">
                        {isFillMode
                          ? renderFillInText(card.usageNote, card.id, "usageNote")
                          : renderHighlightedText(card.usageNote, card.id, "usageNote")}
                      </p>
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="space-y-1" data-field="exampleEn" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "exampleEn", card.exampleEn || "")}>
                      <p className="text-xs font-medium">示例</p>
                      <p className="text-sm">
                        {isFillMode
                          ? renderFillInText(card.exampleEn, card.id, "exampleEn")
                          : renderHighlightedText(card.exampleEn, card.id, "exampleEn")}
                      </p>
                      {card.exampleZh && (
                        <p className="text-xs text-muted-foreground">{card.exampleZh}</p>
                      )}
                    </div>
                  )}
                  {card.analysis && (
                    <div className="p-2 bg-primary/5 rounded-lg" data-field="analysis" onMouseUp={() => !isFillMode && handleTextSelect(card.id, "analysis", card.analysis || "")}>
                      <p className="text-xs font-medium">分析</p>
                      <p className="text-xs text-muted-foreground">
                        {isFillMode
                          ? renderFillInText(card.analysis, card.id, "analysis")
                          : renderHighlightedText(card.analysis, card.id, "analysis")}
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
