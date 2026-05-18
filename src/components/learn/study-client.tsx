"use client"

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "@/components/providers/theme-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Volume2, VolumeX, Heart, PenLine, Check, X, Eye, EyeOff, Music, ListChecks, Sparkles, MessageSquare, RotateCcw } from "lucide-react"
import { Confetti } from "@/components/ui/confetti"
import { ComboBurst } from "@/components/ui/combo-burst"
import { playCorrectSound, playWrongSound, playComboSound, playPianoKeySound, playYoudaoAudio, getSoundEnabledFromStorage, saveSoundEnabledToStorage, setSoundEnabled as setSoundEnabledGlobal } from "@/lib/sounds"

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

interface MenuState {
  show: boolean
  position: { x: number; y: number }
  cardId: string
  field: string
  start: number
  end: number
  text: string
  annotationId?: string
}

interface StudyClientProps {
  cards: Card[]
  subChapterId: string
  bookType: string
  bookSubType: string | null
  annotations: Record<string, Annotation[]>
  setAnnotations: React.Dispatch<React.SetStateAction<Record<string, Annotation[]>>>
  fieldStyles?: Record<string, FieldStyle> | null
  menuState: MenuState | null
  setMenuState: React.Dispatch<React.SetStateAction<MenuState | null>>
  // 挖空模式相关
  activeFillCardId: string | null
  setActiveFillCardId: (id: string | null) => void
  fillModeCards: Record<string, Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>
  setFillModeCards: React.Dispatch<React.SetStateAction<Record<string, Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>>>
  // 答题历史相关
  fillAnswerHistory: Record<string, { correct: number; incorrect: number }>
  setFillAnswerHistory: React.Dispatch<React.SetStateAction<Record<string, { correct: number; incorrect: number }>>>
  saveFillAnswerHistory: (cardId: string, correct: number, incorrect: number) => void
  // 初始卡片索引（从收藏页跳转时使用）
  initialCardIndex?: number
  // 拼写弹窗是否打开
  spellingModalOpen?: boolean
}

export function StudyClient({
  cards,
  subChapterId,
  bookType,
  annotations,
  setAnnotations,
  fieldStyles,
  menuState,
  setMenuState,
  activeFillCardId,
  setActiveFillCardId,
  fillModeCards,
  setFillModeCards,
  fillAnswerHistory,
  setFillAnswerHistory,
  saveFillAnswerHistory,
  initialCardIndex,
  spellingModalOpen
}: StudyClientProps) {
  const { data: session } = useSession()
  const [currentIndex, setCurrentIndex] = useState(initialCardIndex || 0)
  const [progress, setProgress] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  // 主题
  const { theme } = useTheme()

  // 学习时间记录
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null)

  // 卡片级挖空模式状态
  const [showAnswer, setShowAnswer] = useState(false)
  // 标记是否是查看答案模式（不播放动效）
  const [isViewingAnswer, setIsViewingAnswer] = useState(false)
  // 琴音模式 - 每个字母输入时发出钢琴音色（从localStorage加载）
  const [pianoMode, setPianoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pianoMode')
      return saved === 'true'
    }
    return false
  })

  // 监听琴音模式变化，保存到localStorage
  useEffect(() => {
    localStorage.setItem('pianoMode', String(pianoMode))
  }, [pianoMode])

  // 音效开关状态（不影响琴音模式）- 默认 true，避免水合错误
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true)

  // 挂载后从 localStorage 读取音效开关状态
  useEffect(() => {
    setSoundEnabledState(getSoundEnabledFromStorage())
  }, [])

  // 监听音效开关变化，保存到 localStorage
  useEffect(() => {
    setSoundEnabledGlobal(soundEnabled)
    saveSoundEnabledToStorage(soundEnabled)
  }, [soundEnabled])

  // 监听showAnswer，隐藏答案时重置查看答案模式
  useEffect(() => {
    if (!showAnswer) {
      setIsViewingAnswer(false)
    }
  }, [showAnswer])
  const [showConfetti, setShowConfetti] = useState(false)
  // 连击计数
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  // 当前聚焦的挖空索引
  const [focusedFillIndex, setFocusedFillIndex] = useState<number | null>(null)
  // 当前聚焦的字段
  const [focusedField, setFocusedField] = useState<string | null>(null)
  // 记录按Tab跳过的挖空（显示为错误）- 按字段区分
  const [skippedFills, setSkippedFills] = useState<Record<string, Record<string, number[]>>>({})

  // 选择模式状态
  const [activeSelectCardId, setActiveSelectCardId] = useState<string | null>(null)
  // 选择模式数据: 卡片ID -> 选择模式状态
  const [selectModeData, setSelectModeData] = useState<Record<string, {
    correctAnswers: string[]
    shuffledOptions: string[]
    filledAnswers: (string | null)[]
    completed: boolean[]
  }>>({})
  // 当前聚焦的选择索引
  const [focusedSelectIndex, setFocusedSelectIndex] = useState(0)
  // 选择模式悬浮窗状态
  const [selectPanelCollapsed, setSelectPanelCollapsed] = useState(false)
  const [selectPanelPosition, setSelectPanelPosition] = useState({ x: 0, y: 0 })
  const selectPanelRef = useRef<HTMLDivElement>(null)
  const selectPanelScrollRef = useRef<HTMLDivElement>(null)
  const selectPanelDragRef = useRef({ isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 })
  // 使用 ref 跟踪拼写弹窗状态，避免闭包问题
  const spellingModalOpenRef = useRef(spellingModalOpen)
  useEffect(() => {
    spellingModalOpenRef.current = spellingModalOpen
  }, [spellingModalOpen])

  // 初始化选择模式悬浮窗位置
  useEffect(() => {
    if (activeSelectCardId) {
      setSelectPanelPosition({
        x: window.innerWidth / 2 - 300, // 居中，假设面板宽度600px
        y: window.innerHeight - 300 // 底部对齐
      })
    }
  }, [activeSelectCardId])

  // 自动滚动以保持焦点的按钮可见
  useEffect(() => {
    const container = selectPanelScrollRef.current
    if (!container || focusedSelectIndex === null) return

    // Use setTimeout to ensure DOM has updated after index change
    const timer = setTimeout(() => {
      const buttons = container.querySelectorAll('button')
      const focusedBtn = buttons[focusedSelectIndex]
      if (focusedBtn) {
        const btnRect = focusedBtn.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        if (btnRect.bottom > containerRect.bottom) {
          focusedBtn.scrollIntoView({ behavior: 'smooth', block: 'end' })
        } else if (btnRect.top < containerRect.top) {
          focusedBtn.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 10)

    return () => clearTimeout(timer)
  }, [focusedSelectIndex])

  // 使用 ref 同步获取当前焦点索引，避免闭包问题
  const focusedSelectIndexRef = useRef(0)

  const currentCard = cards[currentIndex]

  // 记录学习开始时间
  useEffect(() => {
    setStudyStartTime(Date.now())
    return () => {
      // 组件卸载时保存学习时间
      if (studyStartTime && currentCard) {
        const learningTime = Math.round((Date.now() - studyStartTime) / 1000)
        if (learningTime > 0) {
          fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cardId: currentCard.id,
              status: "learning",
              learningTime
            })
          }).catch(console.error)
        }
      }
    }
  }, [])

  // 保存学习时间并重新计时
  const saveStudyTime = useCallback(() => {
    if (studyStartTime && currentCard) {
      const learningTime = Math.round((Date.now() - studyStartTime) / 1000)
      if (learningTime > 0) {
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: currentCard.id,
            status: "learning",
            learningTime
          })
        }).catch(console.error)
      }
      // 重新开始计时
      setStudyStartTime(Date.now())
    }
  }, [studyStartTime, currentCard])

  // 切换卡片时重置挖空状态
  useEffect(() => {
    setShowAnswer(false)
    setFocusedFillIndex(null)
    setCombo(0)
    setShowCombo(false)
  }, [currentIndex])

  // 测量挖空输入框宽度（useLayoutEffect 在浏览器绘制前同步执行，避免闪烁）
  useLayoutEffect(() => {
    if (!currentCard || !activeFillCardId) return

    const inputs = document.querySelectorAll('input.fill-input[data-answer]') as NodeListOf<HTMLInputElement>

    inputs.forEach((input) => {
      const answer = input.dataset.answer
      if (!answer) return

      // 测量答案文本的宽度和高度
      const span = document.createElement('span')
      span.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + window.getComputedStyle(input).font
      span.textContent = answer
      document.body.appendChild(span)
      const width = span.offsetWidth
      const height = span.offsetHeight
      document.body.removeChild(span)

      // 只有当尺寸有效时才设置
      if (width > 0 && height > 0) {
        input.style.width = width + 'px'
        input.style.height = height + 'px'
      }
    })
  }, [currentCard, activeFillCardId, currentIndex])

  // 连击显示后自动隐藏
  useEffect(() => {
    if (showCombo) {
      const timer = setTimeout(() => {
        setShowCombo(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showCombo, combo])

  // 获取字段样式类名
  const getFieldStyleClass = (field: string): string => {
    if (!fieldStyles || !fieldStyles[field]) return ''
    const style = fieldStyles[field]
    return `${style.fontSize} ${style.fontWeight} ${style.color} ${style.italic ? 'italic' : ''}`.trim()
  }

  // 用于跟踪本轮已计数的卡片，避免重复计数
  const countedCardsRef = useRef<Set<string>>(new Set())
  // 用于标记是否刚刚重置过
  const justResetRef = useRef(false)

  // 监听答题状态变化，更新历史记录并保存到服务器
  useEffect(() => {
    if (!activeFillCardId || !currentCard) return

    const cardFields = fillModeCards[currentCard.id]
    if (!cardFields) return

    // 获取该卡片的挖空数量（排除下划线）
    const cardAnnotations = annotations[currentCard.id] || []
    const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
    const totalFills = highlightAnnotations.length

    if (totalFills === 0) return

    // 统计所有字段的答题数
    let answeredCount = 0
    Object.values(cardFields).forEach((fieldState: any) => {
      answeredCount += Object.values(fieldState).filter((s: any) => s.checked).length
    })

    // 只有当所有挖空都回答了才更新历史
    if (answeredCount === totalFills) {
      // 如果刚刚重置过，清除标记和计数记录，允许重新计数
      if (justResetRef.current) {
        justResetRef.current = false
        countedCardsRef.current.delete(currentCard.id)
      }

      // 检查是否已在本轮计数过
      if (countedCardsRef.current.has(currentCard.id)) {
        return
      }

      // 检查所有字段是否都正确
      let allCorrect = true
      Object.values(cardFields).forEach((fieldState: any) => {
        if (!Object.values(fieldState).every((s: any) => s.isCorrect === true)) {
          allCorrect = false
        }
      })

      // 标记该卡片已计数
      countedCardsRef.current.add(currentCard.id)

      // 每次所有挖空都回答完就累加计数
      setFillAnswerHistory(prev => {
        const history = prev[currentCard.id] || { correct: 0, incorrect: 0 }
        const newHistory = {
          correct: history.correct + (allCorrect ? 1 : 0),
          incorrect: history.incorrect + (allCorrect ? 0 : 1)
        }
        // 保存到服务器
        saveFillAnswerHistory(currentCard.id, newHistory.correct, newHistory.incorrect)
        return {
          ...prev,
          [currentCard.id]: newHistory
        }
      })
    }
  }, [fillModeCards, activeFillCardId, currentCard, annotations, setFillAnswerHistory, saveFillAnswerHistory])

  // 监听卡片索引变化，自动退出挖空模式和选择模式
  const prevIndexRef = useRef(currentIndex)
  useEffect(() => {
    // 只有当索引真正改变时才处理
    if (prevIndexRef.current !== currentIndex) {
      // 退出挖空模式并清除答题状态
      if (activeFillCardId) {
        setActiveFillCardId(null)
        setFillModeCards(prev => {
          const newState = { ...prev }
          delete newState[activeFillCardId]
          return newState
        })
      }
      // 退出选择模式并清除选择状态
      if (activeSelectCardId) {
        setActiveSelectCardId(null)
        setSelectModeData(prev => {
          const newState = { ...prev }
          delete newState[activeSelectCardId]
          return newState
        })
      }
      prevIndexRef.current = currentIndex
    }
  }, [currentIndex, activeFillCardId, activeSelectCardId])

  // 切换卡片时清除计数标记，允许切回来后重新计数
  useEffect(() => {
    countedCardsRef.current.clear()
  }, [currentIndex])
  const total = cards.length

  // 初始化选择模式
  const initializeSelectMode = (card: Card) => {
    const cardAnnotations = annotations[card.id] || []
    const fillWords = extractFillWords(card, cardAnnotations)

    // 打乱选项 - 使用原始 fillWords 的副本，避免修改原数组
    const wordsCopy = fillWords.slice()
    const shuffled = shuffleArray(wordsCopy)

    const newCardData = {
      correctAnswers: fillWords.slice(),
      shuffledOptions: shuffled.slice(),
      filledAnswers: new Array(fillWords.length).fill(null),
      completed: new Array(fillWords.length).fill(false)
    }

    // 直接替换整个 state，确保没有残留
    const newState: Record<string, typeof newCardData> = {}
    newState[card.id] = newCardData

    setSelectModeData(newState)
    setFocusedSelectIndex(0)
    focusedSelectIndexRef.current = 0
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中，不处理以下快捷键
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // 左右键：挖空模式下移动挖空焦点，选择模式下移动选项焦点，普通模式下切换卡片
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (activeFillCardId && currentCard) {
          // 挖空模式下：向左移动到上一个挖空
          const cardAnnotations = annotations[currentCard.id] || []
          const fillAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
          if (fillAnnotations.length === 0) return
          // 按字段和位置排序
          const sortedFills = [...fillAnnotations].sort((a: Annotation, b: Annotation) => {
            if (a.field !== b.field) return a.field.localeCompare(b.field)
            return a.startOffset - b.startOffset
          })
          // 获取当前字段的挖空数量
          const field = focusedField || "primary"
          const fieldFills = sortedFills.filter((a: Annotation) => a.field === field)
          const fieldFillCount = fieldFills.length
          if (fieldFillCount === 0) return
          // 计算新的挖空索引（在当前字段内循环）
          let newFillIndex = (focusedFillIndex || 0) - 1
          if (newFillIndex < 0) newFillIndex = fieldFillCount - 1
          setFocusedFillIndex(newFillIndex)
          // 聚焦到新的挖空输入框
          setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"][data-field="${field}"]`)
            const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === String(newFillIndex)) as HTMLInputElement
            if (input) input.focus()
          }, 10)
          return
        }
        if (activeSelectCardId && currentCard) {
          // 选择模式下：向左移动选项焦点（循环）
          const data = selectModeData[currentCard.id]
          if (data && data.shuffledOptions.length > 0) {
            const optionsLength = data.shuffledOptions.length
            const newIndex = focusedSelectIndexRef.current <= 0
              ? optionsLength - 1
              : focusedSelectIndexRef.current - 1
            setFocusedSelectIndex(newIndex)
            focusedSelectIndexRef.current = newIndex
          }
        } else {
          // 普通模式：切换到上一张卡片
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1
            setCurrentIndex(newIndex)
            setProgress(((newIndex + 1) / total) * 100)
          }
        }
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (activeFillCardId && currentCard) {
          // 挖空模式下：向右移动到下一个挖空
          const cardAnnotations = annotations[currentCard.id] || []
          const fillAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
          if (fillAnnotations.length === 0) return
          // 按字段和位置排序
          const sortedFills = [...fillAnnotations].sort((a: Annotation, b: Annotation) => {
            if (a.field !== b.field) return a.field.localeCompare(b.field)
            return a.startOffset - b.startOffset
          })
          // 获取当前字段的挖空数量
          const field = focusedField || "primary"
          const fieldFills = sortedFills.filter((a: Annotation) => a.field === field)
          const fieldFillCount = fieldFills.length
          if (fieldFillCount === 0) return
          // 计算新的挖空索引（在当前字段内循环）
          let newFillIndex = ((focusedFillIndex || 0) + 1) % fieldFillCount
          setFocusedFillIndex(newFillIndex)
          // 聚焦到新的挖空输入框
          setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"][data-field="${field}"]`)
            const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === String(newFillIndex)) as HTMLInputElement
            if (input) input.focus()
          }, 10)
          return
        }
        if (activeSelectCardId && currentCard) {
          // 选择模式下：向右移动选项焦点（循环）
          const data = selectModeData[currentCard.id]
          if (data && data.shuffledOptions.length > 0) {
            const optionsLength = data.shuffledOptions.length
            const newIndex = focusedSelectIndexRef.current >= optionsLength - 1
              ? 0
              : focusedSelectIndexRef.current + 1
            setFocusedSelectIndex(newIndex)
            focusedSelectIndexRef.current = newIndex
          }
        } else {
          // 普通模式：切换到下一张卡片
          if (currentIndex < total - 1) {
            const newIndex = currentIndex + 1
            setCurrentIndex(newIndex)
            setProgress(((newIndex + 1) / total) * 100)
          }
        }
        return
      }

      // Alt键：挖空模式下显示当前挖空的词典搜索结果并发音
      if (e.altKey && activeFillCardId && currentCard) {
        e.preventDefault()
        const cardAnnotations = annotations[currentCard.id] || []
        const fillAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
        if (fillAnnotations.length === 0) return
        // 按字段和位置排序
        const sortedFills = [...fillAnnotations].sort((a: Annotation, b: Annotation) => {
          if (a.field !== b.field) return a.field.localeCompare(b.field)
          return a.startOffset - b.startOffset
        })
        const field = focusedField || "primary"
        const fieldFills = sortedFills.filter((a: Annotation) => a.field === field)
        const currentFill = fieldFills[focusedFillIndex || 0]
        if (!currentFill) return
        // 获取挖空对应的原文
        let fieldText = ""
        if (currentFill.field === "primary") fieldText = currentCard.contentPrimary
        else if (currentFill.field === "secondary") fieldText = currentCard.contentSecondary || ""
        else if (currentFill.field === "usageNote") fieldText = currentCard.usageNote || ""
        else if (currentFill.field === "exampleEn") fieldText = currentCard.exampleEn || ""
        else if (currentFill.field === "exampleZh") fieldText = currentCard.exampleZh || ""
        else if (currentFill.field === "analysis") fieldText = currentCard.analysis || ""
        const word = fieldText.slice(currentFill.startOffset, currentFill.endOffset).trim()
        if (word) {
          // 触发词典弹窗（词典弹窗会自动发音）
          window.dispatchEvent(new CustomEvent('spelling-dict-toggle', { detail: { word } }))
        }
        return
      }

      // 空格键：选择模式下提交当前焦点选项的答案
      const isSpaceKey = e.key === " " || e.key === "Spacebar" || e.code === "Space"
      if (isSpaceKey) {
        // 阻止空格键的默认滚动行为
        if (activeSelectCardId && currentCard) {
          e.preventDefault()
          e.stopPropagation()

          const data = selectModeData[currentCard.id]
          if (data && data.shuffledOptions.length > 0 && !data.completed.every(c => c)) {
            // 直接从 state 的 shuffledOptions 数组中获取选项，而不是从 DOM
            const currentIdx = focusedSelectIndexRef.current
            // 确保索引在有效范围内
            if (currentIdx >= 0 && currentIdx < data.shuffledOptions.length) {
              const option = data.shuffledOptions[currentIdx]
              if (option) {
                handleSelect(currentCard.id, option, currentIdx)
                // 选中后发音（无论正确与否）
                speak(option)
              }
            }
          }
          return
        }
      }

      // s键：进入/退出选择模式（输入框中禁用）
      if ((e.key === "s" || e.key === "S") && !isInput) {
        if (activeSelectCardId) {
          // 退出选择模式
          const selectCardIdToRemove = activeSelectCardId
          setActiveSelectCardId(null)
          setSelectModeData(prev => {
            const newState = { ...prev }
            delete newState[selectCardIdToRemove]
            return newState
          })
          setCombo(0)
          setShowCombo(false)
        } else if (currentCard) {
          // 检查是否有挖空
          const cardAnnotations = annotations[currentCard.id] || []
          const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
          if (highlightAnnotations.length > 0) {
            // 退出挖空模式
            if (activeFillCardId) {
              const fillCardIdToRemove = activeFillCardId
              setActiveFillCardId(null)
              setFillModeCards(prev => {
                const newState = { ...prev }
                delete newState[fillCardIdToRemove]
                return newState
              })
            }
            setCombo(0)
            setShowCombo(false)
            setActiveSelectCardId(currentCard.id)
            initializeSelectMode(currentCard)
          }
        }
        return
      }

      // q键：进入/退出挖空模式（输入框中禁用）
      if ((e.key === "q" || e.key === "Q") && !isInput) {
        e.preventDefault()
        if (activeFillCardId) {
          // 退出挖空模式
          const fillCardIdToRemove = activeFillCardId
          setActiveFillCardId(null)
          setFillModeCards(prev => {
            const newState = { ...prev }
            delete newState[fillCardIdToRemove]
            return newState
          })
          setCombo(0)
          setShowCombo(false)
        } else if (currentCard) {
          // 退出选择模式
          if (activeSelectCardId) {
            const selectCardIdToRemove = activeSelectCardId
            setActiveSelectCardId(null)
            setSelectModeData(prev => {
              const newState = { ...prev }
              delete newState[selectCardIdToRemove]
              return newState
            })
          }
          setCombo(0)
          setShowCombo(false)
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

      // e键：切换显示答案 / 重新开始选择模式（挖空输入框中禁用）
      if ((e.key === "e" || e.key === "E") && !isInput) {
        e.preventDefault()
        if (activeSelectCardId && currentCard) {
          // 选择模式下重新开始
          setCombo(0)
          setShowCombo(false)
          initializeSelectMode(currentCard)
        } else if (activeFillCardId) {
          // 挖空模式下切换显示答案
          if (!showAnswer) {
            setIsViewingAnswer(true)
          }
          setShowAnswer(prev => !prev)
          setCombo(0)
          setShowCombo(false)
        }
        return
      }

      // x键：重置挖空内容 / 重置选择模式（挖空输入框中禁用）
      if ((e.key === "x" || e.key === "X") && !isInput) {
        e.preventDefault()
        if (activeSelectCardId && currentCard) {
          // 选择模式下重置
          setCombo(0)
          setShowCombo(false)
          initializeSelectMode(currentCard)
        } else if (activeFillCardId && currentCard) {
          // 挖空模式下重置
          setFillModeCards(prev => {
            const newState = { ...prev }
            delete newState[currentCard.id]
            return newState
          })
          setShowAnswer(false)
          setFocusedFillIndex(0)
          setCombo(0)
          setShowCombo(false)
          // 聚焦到第一个挖空输入框
          setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-card-id="${currentCard.id}"]`)
            const input = Array.from(inputs).find(el => el.getAttribute('data-fill-index') === '0') as HTMLInputElement
            if (input) input.focus()
          }, 100)
        }
        return
      }

      // p键：打开拼写练习（输入框中禁用，拼写弹窗打开时禁用）
      if ((e.key === "p" || e.key === "P") && !isInput && !spellingModalOpenRef.current) {
        e.preventDefault()
        if (currentCard) {
          // 检查当前卡片是否有高亮
          const cardAnnotations = annotations[currentCard.id] || []
          const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
          if (highlightAnnotations.length > 0) {
            window.dispatchEvent(new CustomEvent('spelling-open', { detail: { cardId: currentCard.id } }))
          }
        }
        return
      }

      // 以下快捷键只在挖空模式下生效
      if (!activeFillCardId) return

      // 回车键：提交当前答案并跳转到下一个挖空（在输入框中时允许）
      if (e.key === "Enter" && isInput) {
        e.preventDefault()

        // 获取当前卡片的所有挖空（排除下划线）
        const cardAnnotations = annotations[currentCard.id] || []
        const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
        // 只计算当前字段的挖空数量
        const currentField = focusedField || "primary"
        const fieldAnnotations = highlightAnnotations.filter((a: Annotation) => a.field === currentField)
        const fillCount = fieldAnnotations.length

        if (fillCount === 0) return

        // 提交当前答案 - 使用 focusedField 来获取对应字段的状态
        const cardState = fillModeCards[currentCard.id]?.[currentField] || {}
        const currentIdx = focusedFillIndex || 0
        const currentFieldState = cardState[currentIdx]

        if (currentFieldState && currentFieldState.input.trim()) {
          // 获取原文验证答案 - 只获取当前字段的注解
          let fieldText = ""
          const fieldAnnotations = highlightAnnotations.filter((a: Annotation) => a.field === currentField)
          if (fieldAnnotations.length > 0) {
            // 按位置排序
            const sorted = [...fieldAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)
            const currentAnn = sorted[currentIdx]
            if (currentAnn) {
              // 获取对应字段的原文
              if (currentField === "primary") fieldText = currentCard.contentPrimary
              else if (currentField === "secondary") fieldText = currentCard.contentSecondary || ""
              else if (currentField === "usageNote") fieldText = currentCard.usageNote || ""
              else if (currentField === "exampleEn") fieldText = currentCard.exampleEn || ""
              else if (currentField === "exampleZh") fieldText = currentCard.exampleZh || ""
              else if (currentField === "analysis") fieldText = currentCard.analysis || ""

              const answer = fieldText.slice(currentAnn.startOffset, currentAnn.endOffset).trim().toLowerCase()
              const isCorrect = currentFieldState.input.trim().toLowerCase() === answer

              // 播放音效
              if (isCorrect) {
                playCorrectSound()
                speak(answer)
              } else {
                playWrongSound()
                speak(answer)
              }

              // 更新连击计数
              if (isCorrect) {
                setCombo(prev => {
                  const newCombo = prev + 1
                  if (newCombo >= 2) {
                    setShowCombo(true)
                    playComboSound(newCombo)
                  }
                  return newCombo
                })
              } else {
                setCombo(0)
                setShowCombo(false)
              }

              // 更新当前答案为已检查状态
              setFillModeCards(prev => {
                const newState = {
                  ...prev,
                  [currentCard.id]: {
                    ...prev[currentCard.id],
                    [currentField]: {
                      ...(prev[currentCard.id]?.[currentField] || {}),
                      [currentIdx]: { ...currentFieldState, checked: true, isCorrect }
                    }
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
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, total, activeFillCardId, activeSelectCardId, currentCard, focusedFillIndex, focusedField, fillModeCards, annotations, setFillModeCards, setActiveSelectCardId, setSelectModeData, selectModeData, spellingModalOpen])

  // 选择模式悬浮窗拖动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!selectPanelDragRef.current.isDragging) return
      const deltaX = e.clientX - selectPanelDragRef.current.startX
      const deltaY = e.clientY - selectPanelDragRef.current.startY
      setSelectPanelPosition({
        x: selectPanelDragRef.current.startPosX + deltaX,
        y: selectPanelDragRef.current.startPosY + deltaY
      })
    }

    const handleMouseUp = () => {
      selectPanelDragRef.current.isDragging = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

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
    // 获取所有高亮注解（包括下划线）
    const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field && a.highlight)

    // 辅助函数：处理文本片段中的换行
    const processNewlines = (content: string): React.ReactNode => {
      if (!content.includes('\n')) return content
      return content.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))
    }

    if (fieldAnnotations.length === 0) {
      // 没有挖空时，返回保留换行的文本
      return processNewlines(text)
    }

    // 分离下划线和其他高亮
    const underlineAnnotations = fieldAnnotations.filter((a: Annotation) => a.highlight === "underline")
    const fillAnnotations = fieldAnnotations.filter((a: Annotation) => a.highlight !== "underline")

    if (fillAnnotations.length === 0 && underlineAnnotations.length === 0) return text

    // 过滤填充注解的重叠
    const sortedFills = [...fillAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)
    const validFillAnnotations: Annotation[] = []
    for (const ann of sortedFills) {
      const isOverlapping = validFillAnnotations.some(
        existing => !(ann.endOffset <= existing.startOffset || ann.startOffset >= existing.endOffset)
      )
      if (!isOverlapping) {
        validFillAnnotations.push(ann)
      }
    }

    // 将所有注解（包括下划线）合并并按位置排序，统一处理
    const allAnnotations = [
      ...validFillAnnotations.map((a, i) => ({ ...a, _type: 'fill' as const, _fillIndex: i })),
      ...underlineAnnotations.map(a => ({ ...a, _type: 'underline' as const }))
    ].sort((a, b) => a.startOffset - b.startOffset)

    const parts: React.JSX.Element[] = []
    let lastEnd = 0
    // 使用 field 区分不同字段的挖空状态
    const cardState = fillModeCards[cardId]?.[field] || {}

    allAnnotations.forEach((ann: any, renderIndex: number) => {
      // 跳过重叠的注解
      if (ann.startOffset < lastEnd) return

      // 将渲染索引添加到注解对象上
      ann.renderIndex = renderIndex

      // 渲染普通文本（如果当前注解前有间隙）
      if (ann.startOffset > lastEnd) {
        parts.push(<span key={`text-${lastEnd}`}>{processNewlines(text.slice(lastEnd, ann.startOffset))}</span>)
      }

      if (ann._type === 'underline') {
        // 渲染下划线
        parts.push(
          <span key={`underline-${ann.startOffset}`} className="px-0.5 -mx-0.5 highlighted-text" style={{ textDecoration: "underline" }}>
            {processNewlines(text.slice(ann.startOffset, ann.endOffset))}
          </span>
        )
        lastEnd = ann.endOffset
      } else {
        // 渲染挖空
        const answer = text.slice(ann.startOffset, ann.endOffset)
        const fieldState = cardState[ann._fillIndex] || { input: "", checked: false, isCorrect: null }
        const userInput = fieldState.input
        const isChecked = fieldState.checked

        let fillContent: React.ReactNode

        if (showAnswer) {
          // 查看答案模式：显示所有正确答案，不播放动效
          const isSkipped = skippedFills[cardId]?.[field]?.includes(ann._fillIndex)
          const isWrong = isSkipped || fieldState.isCorrect === false

          // 查看答案时，答错的显示红色，其他都显示绿色（显示正确答案）
          const showCorrect = !isWrong || isViewingAnswer

          fillContent = (
            <span className={`px-0.5 -mx-0.5 rounded animate-scale-in ${
              showCorrect
                ? "bg-emerald-200 text-emerald-900"
                : "bg-red-200 text-red-900"
            }`}>
              {answer}
            </span>
          )
        } else if (isChecked) {
          fillContent = (
            <span className={`relative px-0.5 -mx-0.5 rounded animate-scale-in ${
              fieldState.isCorrect
                ? "bg-emerald-200 text-emerald-900"
                : "bg-red-200 text-red-900"
            }`}>
              {answer}
              {fieldState.isCorrect && (
                <span className="absolute -top-1 -right-1 pointer-events-none">
                  <Confetti show={true} />
                </span>
              )}
            </span>
          )
        } else {
          // 直接渲染输入框，测量代码会自动设置尺寸
          fillContent = (
            <input
              type="text"
              data-card-id={cardId}
              data-fill-index={ann._fillIndex}
              data-start-offset={ann.startOffset}
              data-end-offset={ann.endOffset}
              data-answer={answer}
              data-field={field}
              autoFocus={focusedFillIndex === ann._fillIndex}
              className="fill-input"
              value={userInput}
              onChange={(e) => {
                // 琴音模式：输入字符时播放钢琴音效
                if (pianoMode && e.target.value.length > (userInput?.length || 0)) {
                  const newChar = e.target.value.slice(-1)
                  playPianoKeySound(newChar)
                }
                setFocusedFillIndex(ann._fillIndex)
                setFocusedField(field)
                setFillModeCards(prev => ({
                  ...prev,
                  [cardId]: {
                    ...(prev[cardId] || {}),
                    [field]: {
                      ...(prev[cardId]?.[field] || {}),
                      [ann._fillIndex]: { input: e.target.value, checked: false, isCorrect: null }
                    }
                  }
                }))
              }}
                onFocus={() => {
                  setFocusedFillIndex(ann._fillIndex)
                  setFocusedField(field)
                }}
                onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault()
                  e.stopPropagation()
                  // Tab键：标记为错误，显示答案，跳到下一个
                  const cardId = currentCard.id
                  const currentFillIndex = ann._fillIndex
                  const currentStartOffset = ann.startOffset
                  const currentEndOffset = ann.endOffset
                  const renderIndex = ann.renderIndex // 使用渲染时的索引

                  // 播放错误音效
                  playWrongSound()
                  const skipAnswer = text.slice(currentStartOffset, currentEndOffset)
                  speak(skipAnswer)
                  setCombo(0)
                  setShowCombo(false)

                  // 记录这个挖空跳过，标记为错误
                  setSkippedFills(prev => ({
                    ...prev,
                    [cardId]: {
                      ...(prev[cardId] || {}),
                      [field]: [...(prev[cardId]?.[field] || []), currentFillIndex]
                    }
                  }))

                  // 设置为已检查并标记为错误，立即显示答案
                  setFillModeCards(prev => ({
                    ...prev,
                    [cardId]: {
                      ...(prev[cardId] || {}),
                      [field]: {
                        ...(prev[cardId]?.[field] || {}),
                        [currentFillIndex]: { input: "", checked: true, isCorrect: false }
                      }
                    }
                  }))

                  // 移动到下一个挖空 - 直接使用渲染索引+1
                  setTimeout(() => {
                    const inputs = document.querySelectorAll(`[data-card-id="${cardId}"]`)
                    // 找到下一个输入框（当前输入框之后的那个）
                    const currentInput = Array.from(inputs).find((el: Element) => {
                      const fillIdx = el.getAttribute('data-fill-index')
                      const startOffset = el.getAttribute('data-start-offset')
                      const endOffset = el.getAttribute('data-end-offset')
                      return startOffset === String(currentStartOffset) && endOffset === String(currentEndOffset)
                    }) as HTMLInputElement

                    if (currentInput) {
                      // 获取当前输入框在所有输入框中的索引
                      const inputsArray = Array.from(inputs)
                      const currentIndex = inputsArray.indexOf(currentInput)
                      const nextIndex = currentIndex + 1

                      if (nextIndex < inputsArray.length) {
                        const nextInput = inputsArray[nextIndex] as HTMLInputElement
                        nextInput.focus()
                        nextInput.select()
                      } else {
                        // 如果是最后一个，回到第一个
                        const firstInput = inputsArray[0] as HTMLInputElement
                        firstInput.focus()
                        firstInput.select()
                      }
                    }
                  }, 100)
                }
              }}
            />
          )
        }

        parts.push(<React.Fragment key={`fill-input-${cardId}-${field}-${ann._fillIndex}`}>{fillContent}</React.Fragment>)

        lastEnd = ann.endOffset
      }
    })

    // 渲染剩余的文本
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{processNewlines(text.slice(lastEnd))}</span>)
    }

    return parts
  }

  // 渲染选择模式挖空文本
  const renderSelectFillText = (text: string, cardId: string, field: string) => {
    const cardAnnotations = annotations[cardId] || []
    // 获取所有高亮注解（包括下划线）
    const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field && a.highlight)

    // 辅助函数：处理文本片段中的换行
    const processNewlines = (content: string): React.ReactNode => {
      if (!content.includes('\n')) return content
      return content.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))
    }

    if (fieldAnnotations.length === 0) {
      return processNewlines(text)
    }

    // 分离下划线和其他高亮
    const underlineAnnotations = fieldAnnotations.filter((a: Annotation) => a.highlight === "underline")
    const fillAnnotations = fieldAnnotations.filter((a: Annotation) => a.highlight !== "underline")

    if (fillAnnotations.length === 0 && underlineAnnotations.length === 0) return text

    // 过滤填充注解的重叠
    const sortedFills = [...fillAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)
    const validFillAnnotations: Annotation[] = []
    for (const ann of sortedFills) {
      const isOverlapping = validFillAnnotations.some(
        existing => !(ann.endOffset <= existing.startOffset || ann.startOffset >= existing.endOffset)
      )
      if (!isOverlapping) {
        validFillAnnotations.push(ann)
      }
    }

    // 将所有注解（包括下划线）合并并按位置排序，统一处理
    const allAnnotations = [
      ...validFillAnnotations.map((a, i) => ({ ...a, _type: 'fill' as const, _fillIndex: i })),
      ...underlineAnnotations.map(a => ({ ...a, _type: 'underline' as const }))
    ].sort((a, b) => a.startOffset - b.startOffset)

    const parts: React.JSX.Element[] = []
    let lastEnd = 0

    // 获取选择模式数据
    const selectData = selectModeData[cardId]

    allAnnotations.forEach((ann: any) => {
      if (ann.startOffset < lastEnd) return

      if (ann.startOffset > lastEnd) {
        parts.push(<span key={`text-${lastEnd}`}>{processNewlines(text.slice(lastEnd, ann.startOffset))}</span>)
      }

      if (ann._type === 'underline') {
        parts.push(
          <span key={`underline-${ann.startOffset}`} className="px-0.5 -mx-0.5 highlighted-text" style={{ textDecoration: "underline" }}>
            {processNewlines(text.slice(ann.startOffset, ann.endOffset))}
          </span>
        )
        lastEnd = ann.endOffset
      } else {
        // 渲染选择模式挖空
        const answer = text.slice(ann.startOffset, ann.endOffset)

        let fillContent: React.ReactNode

        // 检查这个位置是否已完成（已选择正确答案）
        const isCompleted = selectData?.completed[ann._fillIndex] ?? false
        const filledAnswer = selectData?.filledAnswers[ann._fillIndex] ?? null

        if (isCompleted && filledAnswer) {
          // 已完成，显示正确答案 - 使用与按钮悬浮一致的背景色
          fillContent = (
            <span key={`fill-select-${cardId}-${field}-${ann._fillIndex}`} className="px-0.5 -mx-0.5 rounded bg-accent text-accent-foreground">
              {filledAnswer}
            </span>
          )
        } else {
          // 未完成，显示下划线占位 - 用答案文字撑开宽度，文字透明只显示下划线
          fillContent = (
            <span key={`fill-select-${cardId}-${field}-${ann._fillIndex}`} className="px-0.5 -mx-0.5 rounded border-b-2 border-primary/50 select-fill-placeholder">
              {answer}
            </span>
          )
        }

        parts.push(fillContent)
        lastEnd = ann.endOffset
      }
    })

    // 渲染剩余的文本
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{processNewlines(text.slice(lastEnd))}</span>)
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

  // 提取卡片中的所有挖空单词
  const extractFillWords = (card: Card, cardAnnotations: Annotation[]): string[] => {
    const fillWords: string[] = []

    // 获取所有高亮注解（排除下划线）
    const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")

    // 按位置排序
    const sorted = [...highlightAnnotations].sort((a: Annotation, b: Annotation) => a.startOffset - b.startOffset)

    sorted.forEach((ann: Annotation) => {
      let fieldText = ""
      // 获取对应字段的原文
      if (ann.field === "primary") fieldText = card.contentPrimary
      else if (ann.field === "secondary") fieldText = card.contentSecondary || ""
      else if (ann.field === "usageNote") fieldText = card.usageNote || ""
      else if (ann.field === "exampleEn") fieldText = card.exampleEn || ""
      else if (ann.field === "exampleZh") fieldText = card.exampleZh || ""
      else if (ann.field === "analysis") fieldText = card.analysis || ""

      const word = fieldText.slice(ann.startOffset, ann.endOffset).trim()
      if (word) {
        fillWords.push(word)
      }
    })

    return fillWords
  }

  // 打乱数组
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // 处理选择 - 始终填入第一个未完成的空白
  const handleSelect = (cardId: string, option: string, optionIdx?: number, onSuccess?: () => void) => {
    const data = selectModeData[cardId]
    if (!data) return

    // 始终找到第一个未完成的空白位置
    const currentIndex = data.completed.findIndex(c => !c)
    if (currentIndex === -1) return // 全部已完成

    const correctAnswer = data.correctAnswers[currentIndex]

    // 使用严格比较
    const isCorrect = option === correctAnswer

    if (isCorrect) {
      playCorrectSound()
      speak(option)

      // 使用回调函数模式，获取最新的 state
      setSelectModeData(prev => {
        const currentData = prev[cardId]
        if (!currentData) return prev

        // 重新计算当前索引（使用最新的 completed 数组）
        const nowCompleted = [...currentData.completed]
        const nowCurrentIndex = nowCompleted.findIndex(c => !c)
        if (nowCurrentIndex === -1) return prev // 全部已完成

        const newFilled = [...currentData.filledAnswers]
        newFilled[nowCurrentIndex] = option

        const newCompleted = [...currentData.completed]
        newCompleted[nowCurrentIndex] = true

        // 使用传入的 optionIdx 直接移除对应的选项，而不是用 indexOf 找第一个匹配
        const remainingOptions = [...currentData.shuffledOptions]
        if (optionIdx !== undefined && optionIdx >= 0 && optionIdx < remainingOptions.length) {
          remainingOptions.splice(optionIdx, 1)
        }

        return {
          ...prev,
          [cardId]: {
            ...currentData,
            filledAnswers: newFilled,
            completed: newCompleted,
            shuffledOptions: remainingOptions
          }
        }
      })

      // 成功后重置焦点索引到0，让用户重新选择
      setFocusedSelectIndex(0)
      focusedSelectIndexRef.current = 0

      // 更新连击计数
      setCombo(prev => {
        const newCombo = prev + 1
        if (newCombo >= 2) {
          setShowCombo(true)
          playComboSound(newCombo)
        }
        return newCombo
      })

      // 调用成功回调
      if (onSuccess) {
        onSuccess()
      }
    } else {
      playWrongSound()
      speak(option)
      setCombo(0)
      setShowCombo(false)
      // 允许重选，不做其他处理
    }
  }

  // 重置卡片状态
  const resetFillCard = () => {
    if (currentCard) {
      // 标记刚刚重置过
      justResetRef.current = true
      // 清空挖空内容 - 重置所有字段
      setFillModeCards(prev => {
        const cardFields = prev[currentCard.id]
        if (!cardFields) return prev

        const resetFields: Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>> = {}
        Object.keys(cardFields).forEach(field => {
          const fieldData = cardFields[field]
          const resetData: Record<number, { input: string; checked: boolean; isCorrect: boolean | null }> = {}
          Object.keys(fieldData).forEach(key => {
            const idx = parseInt(key)
            resetData[idx] = {
              input: "",
              checked: false,
              isCorrect: null
            }
          })
          resetFields[field] = resetData
        })
        return { ...prev, [currentCard.id]: resetFields }
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
      // 保存当前卡片的学习时间
      saveStudyTime()
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
      // 保存当前卡片的学习时间
      saveStudyTime()
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setProgress(((newIndex + 1) / total) * 100)
    }
  }

  // 发音 - 使用有道音频
  const speak = (text: string) => {
    playYoudaoAudio(text)
  }

  // 选择模式中发音选项
  const speakOption = (text: string) => {
    playYoudaoAudio(text)
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
  const handleTextSelect = useCallback((cardId: string, field: string, fieldText: string) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setMenuState(null)
      return
    }

    const selectedTextContent = selection.toString().trim()
    if (!selectedTextContent) {
      setMenuState(null)
      return
    }

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
    setMenuState({
      show: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      },
      cardId,
      field,
      start,
      end,
      text: selectedTextContent
    })
  }, [setMenuState])

  // 渲染带高亮的文本
  const renderHighlightedText = (text: string, cardId: string, field: string) => {
    const cardAnnotations = annotations[cardId] || []
    const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field)

    // 辅助函数：处理文本片段中的换行
    const processNewlines = (content: string): React.ReactNode => {
      if (!content.includes('\n')) return content
      return content.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))
    }

    if (fieldAnnotations.length === 0) {
      // 没有高亮时，直接返回保留换行的文本
      return processNewlines(text)
    }

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
        parts.push(<span key={`text-${field}-${index}`}>{processNewlines(text.slice(lastEnd, ann.startOffset))}</span>)
      }

      parts.push(
        <span
          key={`highlight-${field}-${index}`}
          className={`relative group cursor-pointer px-0.5 -mx-0.5 rounded highlighted-text ${ann.note ? "border-b-2 border-dashed border-primary/60" : ""}`}
          style={{
            backgroundColor: ann.highlight && ann.highlight !== "underline" ? ann.highlight : undefined,
            textDecoration: ann.highlight === "underline" ? "underline" : undefined
          }}
          onClick={(e) => {
            e.stopPropagation()
            setMenuState({
              show: true,
              position: { x: e.clientX, y: e.clientY },
              cardId,
              field,
              start: ann.startOffset,
              end: ann.endOffset,
              text: "",
              annotationId: ann.id
            })
          }}
        >
          {processNewlines(text.slice(ann.startOffset, ann.endOffset))}
          {ann.note && (
            <span className="absolute -top-6 left-0 text-xs bg-muted text-foreground px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {ann.note}
            </span>
          )}
        </span>
      )

      lastEnd = ann.endOffset
    })

    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{processNewlines(text.slice(lastEnd))}</span>)
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
          <div className="w-full" id={`card-${currentCard.id}`}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                {/* 左侧：序号和答题历史 */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 h-8">#{currentIndex + 1}</Badge>
                  {/* 显示答题历史 */}
                  {fillAnswerHistory[currentCard.id] && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-emerald-600 font-medium">✓{fillAnswerHistory[currentCard.id].correct}</span>
                      <span className="text-destructive font-medium">✗{fillAnswerHistory[currentCard.id].incorrect}</span>
                    </div>
                  )}
                </div>

                {/* 右侧：操作按钮组 */}
                <div className="flex items-center gap-0.5">
                  {/* 选择模式按钮 - 放在最前面 */}
                  {activeSelectCardId === currentCard.id ? (
                    <div className="flex items-center gap-1 rounded-lg px-2 py-1 mr-1 fill-mode-toolbar bg-secondary">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // 重置选择模式
                          setCombo(0)
                          setShowCombo(false)
                          initializeSelectMode(currentCard)
                        }}
                        className="h-6 text-xs px-1 text-muted-foreground hover:text-primary"
                        title="重新开始"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // 退出选择模式时清空回答和中断连对
                          if (activeSelectCardId) {
                            const selectCardIdToRemove = activeSelectCardId
                            setActiveSelectCardId(null)
                            setSelectModeData(prev => {
                              const newState = { ...prev }
                              delete newState[selectCardIdToRemove]
                              return newState
                            })
                            setCombo(0)
                            setShowCombo(false)
                          }
                        }}
                        className="h-6 text-xs px-1 text-muted-foreground hover:text-primary"
                        title="退出选择模式"
                      >
                        <ListChecks className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // 检查是否有挖空
                        const cardAnnotations = annotations[currentCard.id] || []
                        const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
                        if (highlightAnnotations.length > 0) {
                          // 退出挖空模式时中断连对
                          if (activeFillCardId) {
                            const fillCardIdToRemove = activeFillCardId
                            setActiveFillCardId(null)
                            setFillModeCards(prev => {
                              const newState = { ...prev }
                              delete newState[fillCardIdToRemove]
                              return newState
                            })
                          }
                          setCombo(0)
                          setShowCombo(false)
                          setActiveSelectCardId(currentCard.id)
                          initializeSelectMode(currentCard)
                        }
                      }}
                      className={`h-8 w-8 ${activeSelectCardId ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                      title="选择模式"
                    >
                      <ListChecks className="h-4 w-4" />
                    </Button>
                  )}

                  {/* 挖空模式按钮 */}
                  {activeFillCardId === currentCard.id ? (
                    <div className="flex items-center gap-1 rounded-lg px-2 py-1 mr-1 fill-mode-toolbar bg-secondary">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!showAnswer) {
                            setIsViewingAnswer(true)
                          }
                          setShowAnswer(!showAnswer)
                        }}
                        className="h-6 text-xs px-1 text-muted-foreground hover:text-primary"
                        title={showAnswer ? "隐藏答案" : "查看答案"}
                      >
                        {showAnswer ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <div className="w-px h-4 bg-border" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFillCard}
                        className="h-6 text-xs px-1 text-muted-foreground hover:text-primary"
                        title="重置"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // 退出挖空模式时清空回答和中断连对
                          if (activeFillCardId) {
                            const fillCardIdToRemove = activeFillCardId
                            setActiveFillCardId(null)
                            setFillModeCards(prev => {
                              const newState = { ...prev }
                              delete newState[fillCardIdToRemove]
                              return newState
                            })
                            setCombo(0)
                            setShowCombo(false)
                          }
                        }}
                        className="h-6 text-xs px-1 text-muted-foreground hover:text-primary"
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
                        // 退出选择模式，清空回答，中断连对
                        if (activeSelectCardId) {
                          const selectCardIdToRemove = activeSelectCardId
                          setActiveSelectCardId(null)
                          setSelectModeData(prev => {
                            const newState = { ...prev }
                            delete newState[selectCardIdToRemove]
                            return newState
                          })
                          setCombo(0)
                          setShowCombo(false)
                        }
                        // 退出挖空模式时也清空回答
                        if (activeFillCardId) {
                          const fillCardIdToRemove = activeFillCardId
                          setActiveFillCardId(null)
                          setFillModeCards(prev => {
                            const newState = { ...prev }
                            delete newState[fillCardIdToRemove]
                            return newState
                          })
                        }
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
                      className={`h-8 w-8 ${activeFillCardId ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                      title="挖空学习"
                    >
                      <PenLine className="h-4 w-4" />
                    </Button>
                  )}

                  {/* 琴音模式切换按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPianoMode(!pianoMode)}
                    className={`h-8 w-8 ${pianoMode ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"}`}
                    title={pianoMode ? "关闭琴音模式" : "开启琴音模式"}
                  >
                    <Music className="h-4 w-4" />
                  </Button>

                  {/* 音效开关按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabledState(!soundEnabled)}
                    className={`h-8 w-8 ${soundEnabled ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    title={soundEnabled ? "关闭音效" : "开启音效"}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>

                  {/* 收藏按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    className={`h-8 w-8 text-muted-foreground ${favorited ? "text-red-500" : "hover:text-red-500"}`}
                    title={favorited ? "取消收藏" : "收藏"}
                  >
                    <Heart className={`h-4 w-4 ${favorited ? "fill-current" : "fill-none"}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent ref={contentRef} className="relative">
                {/* 连击特效 */}
                <ComboBurst show={showCombo && combo >= 2} combo={combo} onComplete={() => setShowCombo(false)} />
                {/* 词汇卡片布局 */}
                {bookType === "vocabulary" && (
                  <div className="space-y-2">
                    {/* 第一列：单词 */}
                    <div data-field="primary" onMouseUp={() => handleTextSelect(currentCard.id, "primary", currentCard.contentPrimary)}>
                      <CardTitle className={getFieldStyleClass("primary") || "text-3xl font-bold text-primary"}>
                        {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                          ? (activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.contentPrimary, currentCard.id, "primary")
                            : renderSelectFillText(currentCard.contentPrimary, currentCard.id, "primary"))
                          : renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </CardTitle>
                    </div>
                    {/* 第二列：释义 */}
                    {currentCard.contentSecondary && (
                      <div data-field="secondary" onMouseUp={() => currentCard.contentSecondary && handleTextSelect(currentCard.id, "secondary", currentCard.contentSecondary)}>
                        <p className={getFieldStyleClass("secondary") || "text-xl text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.contentSecondary, currentCard.id, "secondary")
                              : renderSelectFillText(currentCard.contentSecondary, currentCard.id, "secondary"))
                            : renderHighlightedText(currentCard.contentSecondary, currentCard.id, "secondary")}
                        </p>
                      </div>
                    )}
                    {/* 第三列：用法解释 */}
                    {currentCard.usageNote && (
                      <div data-field="usageNote" onMouseUp={() => handleTextSelect(currentCard.id, "usageNote", currentCard.usageNote || "")}>
                        <p className={getFieldStyleClass("usageNote") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.usageNote, currentCard.id, "usageNote")
                              : renderSelectFillText(currentCard.usageNote, currentCard.id, "usageNote"))
                            : renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}
                        </p>
                      </div>
                    )}
                    {/* 第四列：例句英文 */}
                    {currentCard.exampleEn && (
                      <div data-field="exampleEn" onMouseUp={() => currentCard.exampleEn && handleTextSelect(currentCard.id, "exampleEn", currentCard.exampleEn)}>
                        <p className={getFieldStyleClass("exampleEn") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.exampleEn, currentCard.id, "exampleEn")
                              : renderSelectFillText(currentCard.exampleEn, currentCard.id, "exampleEn"))
                            : renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}
                        </p>
                      </div>
                    )}
                    {/* 第五列：例句中文 */}
                    {currentCard.exampleZh && (
                      <div data-field="exampleZh" onMouseUp={() => currentCard.exampleZh && handleTextSelect(currentCard.id, "exampleZh", currentCard.exampleZh)}>
                        <p className={getFieldStyleClass("exampleZh") || "text-sm text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.exampleZh, currentCard.id, "exampleZh")
                              : renderSelectFillText(currentCard.exampleZh, currentCard.id, "exampleZh"))
                            : renderHighlightedText(currentCard.exampleZh, currentCard.id, "exampleZh")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 句型卡片布局 */}
                {bookType === "sentence" && (
                  <div className="space-y-2">
                    {/* 第一列：句型模板 */}
                    <div data-field="primary" onMouseUp={() => handleTextSelect(currentCard.id, "primary", currentCard.contentPrimary)}>
                      <p className={getFieldStyleClass("primary") || "text-2xl font-bold text-primary"}>
                        {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                          ? (activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.contentPrimary, currentCard.id, "primary")
                            : renderSelectFillText(currentCard.contentPrimary, currentCard.id, "primary"))
                          : renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </p>
                    </div>
                    {/* 第二列：中文句型 */}
                    {currentCard.contentSecondary && (
                      <div data-field="secondary" onMouseUp={() => currentCard.contentSecondary && handleTextSelect(currentCard.id, "secondary", currentCard.contentSecondary)}>
                        <p className={getFieldStyleClass("secondary") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.contentSecondary, currentCard.id, "secondary")
                              : renderSelectFillText(currentCard.contentSecondary, currentCard.id, "secondary"))
                            : renderHighlightedText(currentCard.contentSecondary, currentCard.id, "secondary")}
                        </p>
                      </div>
                    )}
                    {/* 第三列：用法说明 */}
                    {currentCard.usageNote && (
                      <div data-field="usageNote" onMouseUp={() => currentCard.usageNote && handleTextSelect(currentCard.id, "usageNote", currentCard.usageNote)}>
                        <p className={getFieldStyleClass("usageNote") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.usageNote, currentCard.id, "usageNote")
                              : renderSelectFillText(currentCard.usageNote, currentCard.id, "usageNote"))
                            : renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}
                        </p>
                      </div>
                    )}
                    {/* 第四列：例句英文 */}
                    {currentCard.exampleEn && (
                      <div data-field="exampleEn" onMouseUp={() => currentCard.exampleEn && handleTextSelect(currentCard.id, "exampleEn", currentCard.exampleEn)}>
                        <p className={getFieldStyleClass("exampleEn") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.exampleEn, currentCard.id, "exampleEn")
                              : renderSelectFillText(currentCard.exampleEn, currentCard.id, "exampleEn"))
                            : renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}
                        </p>
                      </div>
                    )}
                    {/* 第五列：例句中文 */}
                    {currentCard.exampleZh && (
                      <div data-field="exampleZh" onMouseUp={() => currentCard.exampleZh && handleTextSelect(currentCard.id, "exampleZh", currentCard.exampleZh)}>
                        <p className={getFieldStyleClass("exampleZh") || "text-sm text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.exampleZh, currentCard.id, "exampleZh")
                              : renderSelectFillText(currentCard.exampleZh, currentCard.id, "exampleZh"))
                            : renderHighlightedText(currentCard.exampleZh, currentCard.id, "exampleZh")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 语料卡片布局 */}
                {bookType === "corpus" && (
                  <div className="space-y-2">
                    {/* 第一列：问题 */}
                    <div data-field="primary" onMouseUp={() => handleTextSelect(currentCard.id, "primary", currentCard.contentPrimary)}>
                      <CardTitle className={getFieldStyleClass("primary") || "text-xl font-bold text-primary"}>
                        {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                          ? (activeFillCardId === currentCard.id
                            ? renderFillInText(currentCard.contentPrimary, currentCard.id, "primary")
                            : renderSelectFillText(currentCard.contentPrimary, currentCard.id, "primary"))
                          : renderHighlightedText(currentCard.contentPrimary, currentCard.id, "primary")}
                      </CardTitle>
                    </div>
                    {/* 第二列：正式英文回答 */}
                    {currentCard.contentSecondary && (
                      <div data-field="secondary" onMouseUp={() => currentCard.contentSecondary && handleTextSelect(currentCard.id, "secondary", currentCard.contentSecondary)}>
                        <p className={getFieldStyleClass("secondary") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.contentSecondary, currentCard.id, "secondary")
                              : renderSelectFillText(currentCard.contentSecondary, currentCard.id, "secondary"))
                            : renderHighlightedText(currentCard.contentSecondary, currentCard.id, "secondary")}
                        </p>
                      </div>
                    )}
                    {/* 第三列：正式中文回答 */}
                    {currentCard.usageNote && (
                      <div data-field="usageNote" onMouseUp={() => currentCard.usageNote && handleTextSelect(currentCard.id, "usageNote", currentCard.usageNote)}>
                        <p className={getFieldStyleClass("usageNote") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.usageNote, currentCard.id, "usageNote")
                              : renderSelectFillText(currentCard.usageNote, currentCard.id, "usageNote"))
                            : renderHighlightedText(currentCard.usageNote, currentCard.id, "usageNote")}
                        </p>
                      </div>
                    )}
                    {/* 第四列：口语英文回答 */}
                    {currentCard.exampleEn && (
                      <div data-field="exampleEn" onMouseUp={() => currentCard.exampleEn && handleTextSelect(currentCard.id, "exampleEn", currentCard.exampleEn)}>
                        <p className={getFieldStyleClass("exampleEn") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.exampleEn, currentCard.id, "exampleEn")
                              : renderSelectFillText(currentCard.exampleEn, currentCard.id, "exampleEn"))
                            : renderHighlightedText(currentCard.exampleEn, currentCard.id, "exampleEn")}
                        </p>
                      </div>
                    )}
                    {/* 第五列：口语中文回答 */}
                    {currentCard.exampleZh && (
                      <div data-field="exampleZh" onMouseUp={() => currentCard.exampleZh && handleTextSelect(currentCard.id, "exampleZh", currentCard.exampleZh)}>
                        <p className={getFieldStyleClass("exampleZh") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.exampleZh, currentCard.id, "exampleZh")
                              : renderSelectFillText(currentCard.exampleZh, currentCard.id, "exampleZh"))
                            : renderHighlightedText(currentCard.exampleZh, currentCard.id, "exampleZh")}
                        </p>
                      </div>
                    )}
                    {/* 第六列：分析 */}
                    {currentCard.analysis && (
                      <div data-field="analysis" onMouseUp={() => currentCard.analysis && handleTextSelect(currentCard.id, "analysis", currentCard.analysis)}>
                        <p className={getFieldStyleClass("analysis") || "text-base text-muted-foreground"}>
                          {(activeFillCardId === currentCard.id || activeSelectCardId === currentCard.id)
                            ? (activeFillCardId === currentCard.id
                              ? renderFillInText(currentCard.analysis, currentCard.id, "analysis")
                              : renderSelectFillText(currentCard.analysis, currentCard.id, "analysis"))
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

      {/* 选择模式悬浮窗 */}
      {activeSelectCardId && currentCard && selectModeData[currentCard.id] && (
        <div
          ref={selectPanelRef}
          className="fixed z-50 rounded-xl overflow-hidden"
          style={{
            left: `${selectPanelPosition.x}px`,
            top: `${selectPanelPosition.y}px`,
            width: '600px',
            maxHeight: '300px',
            background: theme === 'dark'
              ? 'rgba(220, 30%, 6%, 0.85)'
              : 'rgba(40, 30%, 96%, 0.9)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: theme === 'dark'
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
            boxShadow: theme === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            e.preventDefault()
            selectPanelDragRef.current = {
              isDragging: true,
              startX: e.clientX,
              startY: e.clientY,
              startPosX: selectPanelPosition.x,
              startPosY: selectPanelPosition.y
            }
          }}
        >
          {/* 面板头部 - 可拖动 */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-grab select-none flex-shrink-0"
            style={{
              borderBottom: theme === 'dark'
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, hsl(38, 75%, 50%) 0%, hsl(38, 90%, 45%) 100%)'
                    : 'linear-gradient(135deg, hsl(38, 90%, 55%) 0%, hsl(38, 80%, 50%) 100%)'
                }}
              >
                <ListChecks className="h-4 w-4 text-white" />
              </div>
              <div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}
                >
                  选择模式
                </span>
                <span
                  className="text-xs ml-2"
                  style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                >
                  {(() => {
                    const data = selectModeData[currentCard.id]
                    const totalFills = data.correctAnswers.length
                    const completedCount = data.completed.filter(c => c).length
                    return `${completedCount} / ${totalFills}`
                  })()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectPanelCollapsed(!selectPanelCollapsed)}
                className="h-7 w-7 p-0 rounded-lg transition-all"
                style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              >
                {selectPanelCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCombo(0)
                  setShowCombo(false)
                  initializeSelectMode(currentCard)
                }}
                className="h-7 w-7 p-0 rounded-lg transition-all"
                title="重新开始"
                style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeSelectCardId) {
                    const selectCardIdToRemove = activeSelectCardId
                    setActiveSelectCardId(null)
                    setSelectModeData(prev => {
                      const newState = { ...prev }
                      delete newState[selectCardIdToRemove]
                      return newState
                    })
                    setCombo(0)
                    setShowCombo(false)
                  }
                }}
                className="h-7 w-7 p-0 rounded-lg transition-all"
                title="退出选择模式"
                style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 面板内容 - 选项按钮，可滚动 */}
          {!selectPanelCollapsed && (
            <div
              className="p-4 overflow-y-auto"
              style={{ maxHeight: '230px' }}
              ref={selectPanelScrollRef}
            >
              <div className="flex flex-wrap justify-center gap-3">
                {selectModeData[currentCard.id].shuffledOptions.map((option, idx) => {
                  const data = selectModeData[currentCard.id]
                  const totalFills = data.correctAnswers.length
                  const completedCount = data.completed.filter(c => c).length
                  const isAllCompleted = completedCount === totalFills
                  const isFocused = focusedSelectIndex === idx
                  return (
                    <Button
                      key={`${option}-${idx}`}
                      variant="ghost"
                      size="lg"
                      data-option-index={idx}
                      onClick={() => {
                        handleSelect(currentCard.id, option, idx)
                      }}
                      disabled={isAllCompleted}
                      tabIndex={-1}
                      className={`min-w-[90px] text-sm px-4 py-2 rounded-xl transition-all border ${
                        isFocused
                          ? 'bg-primary/15 border-primary/40 shadow-lg scale-105'
                          : 'bg-muted/50 border-transparent'
                      } ${isAllCompleted ? 'opacity-50' : ''}`}
                      style={{
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        color: isFocused ? 'hsl(var(--primary))' : undefined,
                      }}
                    >
                      {option}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
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
        快捷键: ← → 切换卡片/选择选项 | S 选择模式 | Q 挖空模式 | E 查看答案 | X 重置 | 空格提交 | Tab 跳过此题
      </div>
    </div>
  )
}
