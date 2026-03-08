"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Volume2, Heart, PenLine, Check, X, Eye, EyeOff } from "lucide-react"

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
  // 挖空模式相关
  activeFillCardId: string | null
  setActiveFillCardId: (id: string | null) => void
  fillModeCards: Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>
  setFillModeCards: React.Dispatch<React.SetStateAction<Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>>
  fillAnswerHistory: Record<string, { correct: number; incorrect: number }>
  setFillAnswerHistory: React.Dispatch<React.SetStateAction<Record<string, { correct: number; incorrect: number }>>>
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
  onHighlightClick,
  activeFillCardId,
  setActiveFillCardId,
  fillModeCards,
  setFillModeCards,
  fillAnswerHistory,
  setFillAnswerHistory
}: StudyClientProps) {
  const { data: session } = useSession()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  // 卡片级挖空模式状态
  const [showAnswer, setShowAnswer] = useState(false)
  // 当前聚焦的挖空索引
  const [focusedFillIndex, setFocusedFillIndex] = useState<number | null>(null)

  // 切换卡片时重置挖空状态
  useEffect(() => {
    setShowAnswer(false)
    setFocusedFillIndex(null)
  }, [currentIndex])

  const currentCard = cards[currentIndex]

  // 用于跟踪本轮已计数的卡片，避免重复计数
  const countedCardsRef = useRef<Set<string>>(new Set())

  // 监听答题状态变化，更新历史记录
  useEffect(() => {
    if (!activeFillCardId || !currentCard) return

    const cardState = fillModeCards[currentCard.id]
    if (!cardState) return

    // 获取该卡片的挖空数量
    const cardAnnotations = annotations[currentCard.id] || []
    const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
    const totalFills = highlightAnnotations.length

    if (totalFills === 0) return

    const answeredCount = Object.values(cardState).filter((s: any) => s.checked).length

    // 只有当所有挖空都回答了才更新历史
    if (answeredCount === totalFills) {
      // 检查是否已在本轮计数过
      if (countedCardsRef.current.has(currentCard.id)) {
        return
      }

      const allCorrect = Object.values(cardState).every((s: any) => s.isCorrect === true)

      // 标记该卡片已计数
      countedCardsRef.current.add(currentCard.id)

      // 每次所有挖空都回答完就累加计数
      setFillAnswerHistory(prev => {
        const history = prev[currentCard.id] || { correct: 0, incorrect: 0 }
        return {
          ...prev,
          [currentCard.id]: {
            correct: history.correct + (allCorrect ? 1 : 0),
            incorrect: history.incorrect + (allCorrect ? 0 : 1)
          }
        }
      })
    }
  }, [fillModeCards, activeFillCardId, currentCard, annotations])

  // 切换卡片时清除计数标记，允许切回来后重新计数
  useEffect(() => {
    countedCardsRef.current.clear()
  }, [currentIndex])
  const total = cards.length

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理以下快捷键
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // 方向键切换卡片（全局）
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1
          setCurrentIndex(newIndex)
          setProgress(((newIndex + 1) / total) * 100)
        }
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (currentIndex < total - 1) {
          const newIndex = currentIndex + 1
          setCurrentIndex(newIndex)
          setProgress(((newIndex + 1) / total) * 100)
        }
        return
      }

      // q键：进入/退出挖空模式（输入框中禁用）
      if ((e.key === "q" || e.key === "Q") && !isInput) {
        e.preventDefault()
        if (activeFillCardId) {
          setActiveFillCardId(null)
        } else if (currentCard) {
          setActiveFillCardId(currentCard.id)
          setShowAnswer(false)
          setFocusedFillIndex(0)
          // 聚焦到第一个挖空输入框
          setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"]`)
            const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === '0') as HTMLInputElement
            if (input) input.focus()
          }, 100)
        }
        return
      }

      // 以下快捷键只在挖空模式下生效
      if (!activeFillCardId) return

      // 回车键：提交当前答案并跳转到下一个挖空（在输入框中时允许）
      if (e.key === "Enter" && isInput) {
        e.preventDefault()

        // 获取当前卡片的所有挖空
        const cardAnnotations = annotations[currentCard.id] || []
        const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight)
        const fillCount = highlightAnnotations.length

        if (fillCount === 0) return

        // 提交当前答案
        const cardState = fillModeCards[currentCard.id] || {}
        const currentIdx = focusedFillIndex || 0
        const currentFieldState = cardState[currentIdx]

        if (currentFieldState && currentFieldState.input.trim()) {
          // 获取原文验证答案
          let fieldText = ""
          const validAnnotations = highlightAnnotations.filter((a: Annotation) => a.field)
          if (validAnnotations.length > 0) {
            const sorted = [...validAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)
            const currentAnn = sorted[currentIdx]
            if (currentAnn) {
              if (currentAnn.field === "primary") fieldText = currentCard.contentPrimary
              else if (currentAnn.field === "usageNote") fieldText = currentCard.usageNote || ""
              else if (currentAnn.field === "exampleEn") fieldText = currentCard.exampleEn || ""
              else if (currentAnn.field === "analysis") fieldText = currentCard.analysis || ""

              const answer = fieldText.slice(currentAnn.startOffset, currentAnn.endOffset).trim().toLowerCase()
              const isCorrect = currentFieldState.input.trim().toLowerCase() === answer

              // 更新当前答案为已检查状态
              setFillModeCards(prev => {
                const newState = {
                  ...prev,
                  [currentCard.id]: {
                    ...prev[currentCard.id],
                    [currentIdx]: { ...currentFieldState, checked: true, isCorrect }
                  }
                }

                return newState
              })
            }
          }
        }

        // 计算下一个挖空索引
        const nextIndex = (currentIdx + 1) % fillCount
        setFocusedFillIndex(nextIndex)

        // 延迟聚焦到下一个输入框
        setTimeout(() => {
          const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"]`)
          const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === String(nextIndex)) as HTMLInputElement
          if (input) {
            input.focus()
          }
        }, 100)
        return
      }

      // 在输入框中时，禁用 e/x 快捷键
      if (isInput) return

      // e键：切换显示答案
      if (e.key === "e" || e.key === "E") {
        e.preventDefault()
        setShowAnswer(prev => !prev)
        return
      }

      // x键：重置挖空内容
      if (e.key === "x" || e.key === "X") {
        e.preventDefault()
        if (currentCard) {
          setFillModeCards(prev => {
            const newState = { ...prev }
            delete newState[currentCard.id]
            return newState
          })
          setShowAnswer(false)
          setFocusedFillIndex(0)
          // 聚焦到第一个挖空输入框
          setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"]`)
            const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === '0') as HTMLInputElement
            if (input) input.focus()
          }, 100)
        }
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, total, activeFillCardId, currentCard, focusedFillIndex, fillModeCards, annotations, setFillModeCards])

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

      if (showAnswer) {
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
            autoFocus={focusedFillIndex === index}
            className="inline-block min-w-[80px] px-2 py-0.5 border-b-2 border-amber-400 bg-transparent focus:outline-none focus:border-amber-600"
            placeholder="?"
            value={userInput}
            onChange={(e) => {
              setFocusedFillIndex(index)
              setFillModeCards(prev => ({
                ...prev,
                [cardId]: {
                  ...(prev[cardId] || {}),
                  [index]: { input: e.target.value, checked: false, isCorrect: null }
                }
              }))
            }}
            onFocus={() => setFocusedFillIndex(index)}
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
  const resetFillCard = () => {
    if (currentCard) {
      // 清空挖空内容
      setFillModeCards(prev => {
        const cardData = prev[currentCard.id]
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
        return { ...prev, [currentCard.id]: resetData }
      })
      setShowAnswer(false)
      // 清除该卡片的计数标记，允许重新计数
      countedCardsRef.current.delete(currentCard.id)
    }
  }

  const goNext = async () => {
    if (currentIndex < total - 1) {
      const newIndex = currentIndex + 1
      // 切换卡片时自动退出填空模式，并清除当前卡片的答题状态
      if (activeFillCardId) {
        setActiveFillCardId(null)
        setFillModeCards(prev => {
          const newState = { ...prev }
          delete newState[activeFillCardId]
          return newState
        })
      }
      setCurrentIndex(newIndex)
      setProgress(((newIndex + 1) / total) * 100)
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
      // 切换卡片时自动退出填空模式，并清除当前卡片的答题状态
      if (activeFillCardId) {
        setActiveFillCardId(null)
        setFillModeCards(prev => {
          const newState = { ...prev }
          delete newState[activeFillCardId]
          return newState
        })
      }
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setProgress(((newIndex + 1) / total) * 100)
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
    const range = selection.getRangeAt(0)

    // 如果只出现一次，直接用 indexOf
    if (allOccurrences.length === 1) {
      start = allOccurrences[0]
    } else {
      // 多次出现时，使用 DOM 位置计算来确定是第几个
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
    const existingAnnotations = annotations[currentCard.id] || []
    const fieldAnnotations = existingAnnotations.filter((a: Annotation) => a.field === field && a.highlight)

    let hasOverlap = false
    for (const ann of fieldAnnotations) {
      if (!(start + selectedTextContent.length <= ann.startOffset || start >= ann.endOffset)) {
        hasOverlap = true
        break
      }
    }

    if (hasOverlap) {
      alert("该区域已有高亮，请选择其他区域")
      setShowMenu(false)
      window.getSelection()?.removeAllRanges()
      return
    }

    setSelectedText({
      text: selectedTextContent,
      start,
      end: start + selectedTextContent.length,
      field,
      cardId: currentCard.id
    })

    // 计算菜单位置
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
        {/* 可拖动的进度条 */}
        <div
          className="relative h-2 bg-muted rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = x / rect.width
            const newIndex = Math.round(percentage * (total - 1))
            setCurrentIndex(newIndex)
            setProgress(((newIndex + 1) / total) * 100)
          }}
        >
          {/* 进度填充 */}
          <div
            className="absolute h-full bg-primary rounded-full transition-all duration-150"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
          {/* 滑块 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${((currentIndex + 1) / total) * 100}% - 8px)` }}
            onMouseDown={(e) => {
              e.stopPropagation()
              const progressBar = e.currentTarget.parentElement
              if (!progressBar) return

              const startX = e.clientX
              const startIndex = currentIndex

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const rect = progressBar.getBoundingClientRect()
                const deltaX = moveEvent.clientX - startX
                const deltaProgress = deltaX / rect.width
                let newIndex = startIndex + Math.round(deltaProgress * total)
                newIndex = Math.max(0, Math.min(total - 1, newIndex))
                setCurrentIndex(newIndex)
                setProgress(((newIndex + 1) / total) * 100)
              }

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }

              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />
        </div>
      </div>

      {/* 阅读模式内容 */}
      <div className="min-h-[400px]">
        {currentCard && (
          <div className="w-full">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                {/* 左侧：序号 + 答题统计 */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 h-8">#{currentIndex + 1}</Badge>
                  {/* 答题历史累计次数 - 常驻显示 */}
                  {(() => {
                    const history = fillAnswerHistory[currentCard.id] || { correct: 0, incorrect: 0 }
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
                  {activeFillCardId === currentCard.id ? (
                    <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1 mr-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="h-6 text-xs px-1"
                        title={showAnswer ? "隐藏答案" : "查看答案"}
                      >
                        {showAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <div className="w-px h-4 bg-amber-300" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFillCard}
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
                        setActiveFillCardId(currentCard.id)
                        setShowAnswer(false)
                        setFocusedFillIndex(0)
                        // 聚焦到第一个挖空输入框
                        setTimeout(() => {
                          const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"]`)
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
                    onClick={toggleFavorite}
                    className={`h-8 w-8 ${favorited ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                    title={favorited ? "取消收藏" : "收藏"}
                  >
                    <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speak(currentCard.contentPrimary)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="朗读"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent onMouseUp={handleTextSelect} ref={contentRef}>
                {/* 词汇卡片布局 */}
                {bookType === "vocabulary" && (
                  <div className="space-y-4">
                    <div className="text-center py-2" data-field="primary">
                      <CardTitle className="text-3xl font-bold text-primary mb-2">
                        {activeFillCardId === currentCard.id
                          ? renderFillInText(currentCard.contentPrimary, currentCard.id, "primary")
                          : renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </CardTitle>
                      <p className="text-xl text-muted-foreground">{currentCard.contentSecondary}</p>
                    </div>
                    {currentCard.usageNote && (
                      <div className="p-3 bg-muted/50 rounded-lg" data-field="usageNote">
                        <p className="text-sm">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.usageNote, currentCard.id, "usageNote")
                            : renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}
                        </p>
                      </div>
                    )}
                    {currentCard.exampleEn && (
                      <div className="border-l-4 border-primary pl-4" data-field="exampleEn">
                        <p className="text-base italic">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.exampleEn, currentCard.id, "exampleEn")
                            : renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}
                        </p>
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
                      <p className="text-2xl font-semibold text-primary">
                        {activeFillCardId === currentCard.id
                          ? renderFillInText(currentCard.contentPrimary, currentCard.id, "primary")
                          : renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </p>
                      {currentCard.contentSecondary && (
                        <p className="text-muted-foreground mt-2">{currentCard.contentSecondary}</p>
                      )}
                    </div>
                    {currentCard.usageNote && (
                      <div className="space-y-2" data-field="usageNote">
                        <p className="text-sm font-medium">用法说明</p>
                        <p className="text-sm text-muted-foreground">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.usageNote, currentCard.id, "usageNote")
                            : renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}
                        </p>
                      </div>
                    )}
                    {currentCard.exampleEn && (
                      <div className="space-y-2" data-field="exampleEn">
                        <p className="text-sm font-medium">例句</p>
                        <p className="text-base italic border-l-2 pl-3 border-primary">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.exampleEn, currentCard.id, "exampleEn")
                            : renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}
                        </p>
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
                        {activeFillCardId === currentCard.id
                          ? renderFillInText(currentCard.contentPrimary, currentCard.id, "primary")
                          : renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </CardTitle>
                      {currentCard.contentSecondary && (
                        <p className="text-muted-foreground">{currentCard.contentSecondary}</p>
                      )}
                    </div>
                    {currentCard.usageNote && (
                      <div className="p-3 bg-muted/50 rounded-lg" data-field="usageNote">
                        <p className="text-sm font-medium">要点</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.usageNote, currentCard.id, "usageNote")
                            : renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}
                        </p>
                      </div>
                    )}
                    {currentCard.exampleEn && (
                      <div className="space-y-2" data-field="exampleEn">
                        <p className="text-sm font-medium">示例</p>
                        <p className="text-base">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.exampleEn, currentCard.id, "exampleEn")
                            : renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}
                        </p>
                        {currentCard.exampleZh && (
                          <p className="text-sm text-muted-foreground">{currentCard.exampleZh}</p>
                        )}
                      </div>
                    )}
                    {currentCard.analysis && (
                      <div className="p-3 bg-primary/5 rounded-lg" data-field="analysis">
                        <p className="text-sm font-medium">分析</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.analysis, currentCard.id, "analysis")
                            : renderHighlightedText(currentCard.analysis, currentCard.id, "analysis")}
                        </p>
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
        快捷键: ← → 切换卡片 | Q 挖空模式 | E 查看答案 | X 重置 | 回车提交
      </div>
    </div>
  )
}
