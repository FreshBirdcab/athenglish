"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Layout, List, Volume2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StudyClient } from "@/components/learn/study-client"
import { StudyList } from "@/components/learn/study-list"
import { DictModal } from "@/components/ui/dict-modal"
import { SpellingModal } from "@/components/ui/spelling-modal"
import { useTheme } from "@/components/providers/theme-provider"
import { playYoudaoAudio } from "@/lib/sounds"

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

interface StudyModeWrapperProps {
  cards: Card[]
  subChapterId: string
  bookType: string
  bookSubType: string | null
  fieldStyles?: Record<string, FieldStyle> | null
  initialCardIndex?: number
}

const HIGHLIGHT_COLORS = [
  { name: "黄色", value: "#fef5c0", label: "yellow" },
  { name: "绿色", value: "#d4fae2", label: "green" },
  { name: "蓝色", value: "#d6e8ff", label: "blue" },
  { name: "粉色", value: "#fde4f2", label: "pink" },
  { name: "橙色", value: "#fee5c5", label: "orange" },
]

const UNDERLINE_STYLE = { name: "下划线", value: "underline", label: "underline" }

export function StudyModeWrapper({ cards, subChapterId, bookType, bookSubType, fieldStyles, initialCardIndex }: StudyModeWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { theme } = useTheme()
  const mode = searchParams.get("mode") || "card"

  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({})
  const [menuState, setMenuState] = useState<{
    show: boolean
    position: { x: number; y: number }
    cardId: string
    field: string
    start: number
    end: number
    text: string
    annotationId?: string
  } | null>(null)
  const [noteInput, setNoteInput] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  // 词典弹窗状态
  const [dictModal, setDictModal] = useState<{
    show: boolean
    word: string
    position: { x: number; y: number }
  } | null>(null)

  // 拼写弹窗状态
  const [spellingModal, setSpellingModal] = useState<{
    show: boolean
    word: string
    cardId: string
    allWords: { word: string; cardId: string; start: number; end: number }[]
    currentIndex: number
  } | null>(null)

  // 使用 ref 跟踪状态，避免闭包问题
  const annotationsRef = useRef(annotations)
  const cardsRef = useRef(cards)
  useEffect(() => {
    annotationsRef.current = annotations
    cardsRef.current = cards
  }, [annotations, cards])

  // 挖空模式相关状态
  const [fillModeCards, setFillModeCards] = useState<Record<string, Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>>({})
  const [activeFillCardId, setActiveFillCardId] = useState<string | null>(null)
  const [fillAnswerHistory, setFillAnswerHistory] = useState<Record<string, { correct: number; incorrect: number }>>({})

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuState?.show) return

      // 如果点击在批注菜单内，不关闭
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return
      }

      // 如果词典弹窗已展开，点击在词典弹窗外时，关闭词典弹窗但不关闭批注菜单
      if (dictModal?.show) {
        // 词典弹窗的遮罩会处理自己的关闭，这里不需要做额外操作
        // 但如果用户点击在词典弹窗外其他地方（穿透遮罩的情况），保持词典弹窗打开
        return
      }

      // 点击在批注菜单外部，关闭批注菜单
      setMenuState(null)
      window.getSelection()?.removeAllRanges()
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuState?.show, dictModal?.show])

  // 当菜单显示且有 annotationId 时，自动填充备注内容
  useEffect(() => {
    if (menuState?.show && menuState.annotationId && annotations[menuState.cardId]) {
      const annotation = annotations[menuState.cardId].find(
        (a: Annotation) => a.id === menuState.annotationId
      )
      if (annotation) {
        setNoteInput(annotation.note || "")
      }
    }
  }, [menuState?.show, menuState?.annotationId, menuState?.cardId, annotations])

  // 加载所有卡片的批注
  useEffect(() => {
    if (!session?.user || cards.length === 0) return

    const cardIds = cards.map(c => c.id)
    Promise.all(
      cardIds.map(cardId =>
        fetch(`/api/annotations?cardId=${cardId}`)
          .then(res => res.json())
          .then(data => ({ cardId, annotations: data.annotations || [] }))
          .catch(() => ({ cardId, annotations: [] }))
      )
    ).then(results => {
      const annotationsMap: Record<string, Annotation[]> = {}
      results.forEach(({ cardId, annotations }) => {
        annotationsMap[cardId] = annotations
      })
      setAnnotations(annotationsMap)
    }).catch(console.error)
  }, [session, cards])

  // 加载答题历史记录
  useEffect(() => {
    if (session?.user) {
      fetch("/api/fill-history")
        .then(res => res.json())
        .then(data => {
          if (data.histories) {
            setFillAnswerHistory(data.histories)
          }
        })
        .catch(console.error)
    }
  }, [session])

  // 监听拼写弹窗的词典查询事件
  useEffect(() => {
    const handleSpellingDictLookup = (e: CustomEvent<{ word: string }>) => {
      const word = e.detail.word
      if (word) {
        // 不关闭拼写弹窗，只打开词典弹窗
        setDictModal({
          show: true,
          word,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        })
      }
    }

    const handleSpellingDictToggle = (e: CustomEvent<{ word: string }>) => {
      const word = e.detail.word
      if (dictModal?.show) {
        // 如果词典弹窗已打开，则关闭
        setDictModal(null)
      } else if (word) {
        // 如果词典弹窗未打开，则打开
        setDictModal({
          show: true,
          word,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        })
      }
    }

    window.addEventListener("spelling-dict-lookup", handleSpellingDictLookup as EventListener)
    window.addEventListener("spelling-dict-toggle", handleSpellingDictToggle as EventListener)
    return () => {
      window.removeEventListener("spelling-dict-lookup", handleSpellingDictLookup as EventListener)
      window.removeEventListener("spelling-dict-toggle", handleSpellingDictToggle as EventListener)
    }
  }, [dictModal?.show])

  const toggleMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newMode)
    router.push(`?${params.toString()}`)
  }

  // 处理文本选择
  const handleTextSelect = useCallback((
    cardId: string,
    text: string,
    start: number,
    end: number,
    field: string,
    position: { x: number; y: number }
  ) => {
    if (!session?.user) {
      alert("请先登录后再使用批注功能")
      return
    }

    setMenuState({
      show: true,
      position,
      cardId,
      field,
      start,
      end,
      text
    })
    setNoteInput("")
  }, [session])

  // 处理高亮点击（编辑已有批注）
  const handleHighlightClick = useCallback((
    cardId: string,
    annotation: Annotation,
    event: React.MouseEvent
  ) => {
    event.stopPropagation()
    if (!session?.user) {
      alert("请先登录后再编辑批注")
      return
    }

    setMenuState({
      show: true,
      position: { x: event.clientX, y: event.clientY },
      cardId,
      field: annotation.field,
      start: annotation.startOffset,
      end: annotation.endOffset,
      text: "",
      annotationId: annotation.id
    })
    setNoteInput(annotation.note || "")
  }, [session])

  // 添加/更新高亮
  const handleHighlight = useCallback(async (color: string) => {
    if (!session?.user || !menuState) return

    const { cardId, field, start, end, annotationId } = menuState

    try {
      if (annotationId) {
        // 更新已有高亮
        await fetch(`/api/annotations?id=${annotationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ highlight: color })
        })
        setAnnotations(prev => ({
          ...prev,
          [cardId]: prev[cardId].map((a: Annotation) =>
            a.id === annotationId ? { ...a, highlight: color } : a
          )
        }))
      } else {
        // 新建高亮前，先找出重叠的批注
        const cardAnnotations = annotations[cardId] || []
        const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field)
        const overlappingAnnotations = fieldAnnotations.filter((a: Annotation) => {
          return !(a.endOffset <= start || a.startOffset >= end)
        })

        // 新建高亮
        const res = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId,
            startOffset: start,
            endOffset: end,
            highlight: color,
            field
          })
        })
        const data = await res.json()
        if (data.annotation) {
          setAnnotations(prev => ({
            ...prev,
            [cardId]: [...(prev[cardId] || []), { ...data.annotation, field }]
          }))

          // 添加新批注后，删除重叠的旧批注
          for (const annotation of overlappingAnnotations) {
            try {
              await fetch(`/api/annotations?id=${annotation.id}`, { method: "DELETE" })
            } catch (error) {
              console.error("删除重叠批注失败:", error)
            }
          }

          // 更新本地状态，移除重叠的批注
          if (overlappingAnnotations.length > 0) {
            setAnnotations(prev => ({
              ...prev,
              [cardId]: prev[cardId].filter((a: Annotation) =>
                !overlappingAnnotations.some((oa: Annotation) => oa.id === a.id)
              )
            }))
          }
        }
      }
    } catch (error) {
      console.error("高亮操作失败:", error)
    }

    setMenuState(null)
    window.getSelection()?.removeAllRanges()
  }, [session, menuState, annotations])

  // 添加/更新备注
  const handleNote = useCallback(async () => {
    if (!session?.user || !menuState) return

    const { cardId, field, start, end, annotationId } = menuState
    const note = noteInput.trim()

    try {
      if (annotationId) {
        // 获取当前注解以保留高亮颜色
        const currentAnnotation = annotations[cardId]?.find((a: Annotation) => a.id === annotationId)

        // 更新已有备注，保留高亮颜色
        await fetch(`/api/annotations?id=${annotationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: note || null,
            highlight: currentAnnotation?.highlight || null
          })
        })
        setAnnotations(prev => ({
          ...prev,
          [cardId]: prev[cardId].map((a: Annotation) =>
            a.id === annotationId ? { ...a, note: note || null } : a
          )
        }))
      } else if (note) {
        // 新建备注前，先找出重叠的批注
        const cardAnnotations = annotations[cardId] || []
        const fieldAnnotations = cardAnnotations.filter((a: Annotation) => a.field === field)
        const overlappingAnnotations = fieldAnnotations.filter((a: Annotation) => {
          return !(a.endOffset <= start || a.startOffset >= end)
        })

        // 新建备注（无高亮）
        const res = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId,
            startOffset: start,
            endOffset: end,
            note,
            field
          })
        })
        const data = await res.json()
        if (data.annotation) {
          setAnnotations(prev => ({
            ...prev,
            [cardId]: [...(prev[cardId] || []), { ...data.annotation, field }]
          }))

          // 添加新批注后，删除重叠的旧批注
          for (const annotation of overlappingAnnotations) {
            try {
              await fetch(`/api/annotations?id=${annotation.id}`, { method: "DELETE" })
            } catch (error) {
              console.error("删除重叠批注失败:", error)
            }
          }

          // 更新本地状态，移除重叠的批注
          if (overlappingAnnotations.length > 0) {
            setAnnotations(prev => ({
              ...prev,
              [cardId]: prev[cardId].filter((a: Annotation) =>
                !overlappingAnnotations.some((oa: Annotation) => oa.id === a.id)
              )
            }))
          }
        }
      }
    } catch (error) {
      console.error("备注操作失败:", error)
    }

    setMenuState(null)
    setNoteInput("")
    window.getSelection()?.removeAllRanges()
  }, [session, menuState, noteInput, annotations])

  // 提取选中单词的逻辑（保留原始格式，用于词典和拼写显示）
  const getSelectedWord = useCallback((): string | null => {
    if (!menuState) return null
    const { cardId, field, start, end, text, annotationId } = menuState
    const card = cards.find(c => c.id === cardId)
    if (!card) return null

    let textToSpeak = ""

    // 字段名映射（data-field 属性值 -> Card 类型中的实际字段名）
    const fieldMap: Record<string, string> = {
      primary: 'contentPrimary',
      secondary: 'contentSecondary',
      usageNote: 'usageNote',
      exampleEn: 'exampleEn',
      exampleZh: 'exampleZh',
      analysis: 'analysis'
    }
    const actualField = fieldMap[field] || field

    if (annotationId) {
      // 点击已标注部分，从字段内容提取
      const fieldContent = card[actualField as keyof Card] as string | null
      if (fieldContent) {
        textToSpeak = fieldContent.slice(start, end).trim()
      }
    } else if (text) {
      // 选中文本
      textToSpeak = text.trim()
    }

    return textToSpeak || null
  }, [menuState, cards])

  // 提取纯净单词（只保留字母，用于发音）
  const getCleanWord = useCallback((): string | null => {
    const word = getSelectedWord()
    if (!word) return null
    const cleanWord = word.replace(/[^a-zA-Z]/g, '')
    return cleanWord || null
  }, [getSelectedWord])

  // 只发音
  const handleSpeak = useCallback(() => {
    const word = getCleanWord()
    if (word) {
      playYoudaoAudio(word)
    }
  }, [getCleanWord])

  // 查询词典（发音 + 弹窗）
  const handleDictLookup = useCallback(() => {
    const word = getSelectedWord()
    if (word && menuState) {
      setDictModal({
        show: true,
        word,
        position: { x: menuState.position.x, y: menuState.position.y }
      })
    }
  }, [getSelectedWord, menuState])

  // 获取卡片中所有标注的单词
  const getAllAnnotatedWords = useCallback((cardId: string, currentWord: string, currentStart: number, currentEnd: number) => {
    const card = cards.find(c => c.id === cardId)
    const cardAnnotations = annotations[cardId] || []
    if (!card) return [{ word: currentWord, cardId, start: currentStart, end: currentEnd }]

    const fieldMap: Record<string, string> = {
      primary: 'contentPrimary',
      secondary: 'contentSecondary',
      usageNote: 'usageNote',
      exampleEn: 'exampleEn',
      exampleZh: 'exampleZh',
      analysis: 'analysis'
    }

    const words: { word: string; cardId: string; start: number; end: number }[] = []

    // 收集当前卡片所有标注的单词（仅高亮颜色，下划线不包含）
    for (const annotation of cardAnnotations) {
      // 跳过下划线标注，只收集彩色高亮
      if (annotation.highlight === "underline" || annotation.highlight === null) continue
      const actualField = fieldMap[annotation.field] || annotation.field
      const fieldContent = card[actualField as keyof Card] as string | null
      if (fieldContent) {
        const text = fieldContent.slice(annotation.startOffset, annotation.endOffset).trim()
        // 保留原始单词格式（包含连字符、空格等），用于显示
        if (text) {
          words.push({
            word: text,
            cardId,
            start: annotation.startOffset,
            end: annotation.endOffset
          })
        }
      }
    }

    // 去重并按文本位置排序
    const uniqueWords = words
      .filter((w, i, arr) =>
        arr.findIndex(v => v.word === w.word && v.start === w.start) === i
      )
      .sort((a, b) => a.start - b.start)

    // 如果没有找到标注单词，使用当前单词
    if (uniqueWords.length === 0) {
      return [{ word: currentWord, cardId, start: currentStart, end: currentEnd }]
    }

    return uniqueWords
  }, [cards, annotations])

  // 单独的 useEffect 处理 spelling-open 事件（放在 getAllAnnotatedWords 之后以避免前向引用）
  useEffect(() => {
    const handleSpellingOpen = (e: CustomEvent<{ cardId: string }>) => {
      const { cardId } = e.detail
      const cardAnnotations = annotationsRef.current[cardId] || []
      const highlightAnnotations = cardAnnotations.filter((a: Annotation) => a.highlight && a.highlight !== "underline")
      if (highlightAnnotations.length === 0) return

      const sortedAnnotations = [...highlightAnnotations].sort((a: Annotation, b: Annotation) => {
        if (a.field !== b.field) return a.field.localeCompare(b.field)
        return a.startOffset - b.startOffset
      })
      const firstAnn = sortedAnnotations[0]

      const fieldMap: Record<string, keyof Card> = {
        primary: 'contentPrimary',
        secondary: 'contentSecondary',
        usageNote: 'usageNote',
        exampleEn: 'exampleEn',
        exampleZh: 'exampleZh',
        analysis: 'analysis'
      }
      const actualField = fieldMap[firstAnn.field] || 'contentPrimary'
      const card = cardsRef.current.find(c => c.id === cardId)
      if (!card) return
      const fieldContent = card[actualField] as string | null
      if (!fieldContent) return

      const word = fieldContent.slice(firstAnn.startOffset, firstAnn.endOffset).trim()
      if (!word) return

      // 直接使用 cardsRef 和 annotationsRef 获取所有标注单词（避免闭包问题）
      const words: { word: string; cardId: string; start: number; end: number }[] = []
      for (const annotation of cardAnnotations) {
        if (annotation.highlight === "underline" || annotation.highlight === null) continue
        const annField = fieldMap[annotation.field] || annotation.field
        const content = card[annField as keyof Card] as string | null
        if (content) {
          const text = content.slice(annotation.startOffset, annotation.endOffset).trim()
          if (text) {
            words.push({
              word: text,
              cardId,
              start: annotation.startOffset,
              end: annotation.endOffset
            })
          }
        }
      }
      const uniqueWords = words
        .filter((w, i, arr) =>
          arr.findIndex(v => v.word === w.word && v.start === w.start) === i
        )
        .sort((a, b) => a.start - b.start)

      const allWords = uniqueWords.length > 0 ? uniqueWords : [{ word, cardId, start: firstAnn.startOffset, end: firstAnn.endOffset }]

      setSpellingModal({
        show: true,
        word: allWords[0].word,
        cardId,
        allWords,
        currentIndex: 0
      })
    }

    window.addEventListener("spelling-open", handleSpellingOpen as EventListener)
    return () => window.removeEventListener("spelling-open", handleSpellingOpen as EventListener)
  }, [])

  // 拼写练习
  const handleSpelling = useCallback(() => {
    if (!menuState) return
    const { cardId, start, end } = menuState
    const word = getSelectedWord()
    if (word) {
      const allWords = getAllAnnotatedWords(cardId, word, start, end)
      const currentIndex = allWords.findIndex(w => w.word === word && w.start === start)
      setSpellingModal({
        show: true,
        word,
        cardId,
        allWords,
        currentIndex: currentIndex >= 0 ? currentIndex : 0
      })
    }
  }, [getSelectedWord, getAllAnnotatedWords, menuState])

  // 删除批注
  const handleDelete = useCallback(async () => {
    if (!session?.user || !menuState?.annotationId) return

    try {
      await fetch(`/api/annotations?id=${menuState.annotationId}`, { method: "DELETE" })
      setAnnotations(prev => ({
        ...prev,
        [menuState.cardId]: prev[menuState.cardId].filter((a: Annotation) => a.id !== menuState.annotationId)
      }))
    } catch (error) {
      console.error("删除失败:", error)
    }

    setMenuState(null)
    window.getSelection()?.removeAllRanges()
  }, [session, menuState])

  // 保存答题历史
  const saveFillAnswerHistory = useCallback(async (cardId: string, correct: number, incorrect: number) => {
    if (!session?.user) return
    try {
      await fetch("/api/fill-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, correctCount: correct, incorrectCount: incorrect })
      })
    } catch (error) {
      console.error("保存答题历史失败:", error)
    }
  }, [session])

  return (
    <div>
      {/* 模式切换按钮 */}
      <div className="flex justify-center gap-2 mb-6">
        <Button
          variant={mode === "card" ? "default" : "outline"}
          size="sm"
          onClick={() => toggleMode("card")}
        >
          <Layout className="h-4 w-4 mr-1" />
          单张卡片
        </Button>
        <Button
          variant={mode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => toggleMode("list")}
        >
          <List className="h-4 w-4 mr-1" />
          全部展示
        </Button>
      </div>

      {/* 批注菜单 */}
      {menuState?.show && (
        <div
          ref={menuRef}
          className="fixed z-50 rounded-lg border p-3 flex flex-col gap-2 min-w-[200px] annotation-popup"
          style={{
            left: menuState.position.x,
            top: menuState.position.y,
            transform: 'translate(-50%, -100%)',
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
        >
          {/* 颜色选择 */}
          <div className="flex gap-1 justify-center">
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.label}
                onClick={() => handleHighlight(color.value)}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            {/* 下划线按钮 */}
            <button
              onClick={() => handleHighlight(UNDERLINE_STYLE.value)}
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center"
              title={UNDERLINE_STYLE.name}
            >
              <span className="text-xs font-bold underline text-amber-700 dark:text-amber-300">U</span>
            </button>
            {/* 删除按钮 */}
            {menuState.annotationId && (
              <button
                onClick={handleDelete}
                className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform"
                title="删除"
              >
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {/* 发音按钮 */}
            <button
              onClick={handleSpeak}
              className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform"
              title="发音"
            >
              <Volume2 className="w-3 h-3 text-sky-700 dark:text-sky-300" />
            </button>
            {/* 查词典按钮 */}
            <button
              onClick={handleDictLookup}
              className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform"
              title="查词典"
            >
              <BookOpen className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
            </button>
            {/* 拼写按钮 */}
            <button
              onClick={handleSpelling}
              className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform"
              title="拼写练习"
            >
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300">拼</span>
            </button>
          </div>

          {/* 备注输入 */}
          <div className="flex gap-1">
            <Input
              placeholder="添加备注..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleNote()
                }
              }}
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" onClick={handleNote} className="h-8 px-3">
              保存
            </Button>
          </div>
        </div>
      )}

      {/* 根据模式渲染不同组件 */}
      {mode === "list" ? (
        <StudyList
          cards={cards}
          bookType={bookType}
          annotations={annotations}
          onTextSelect={handleTextSelect}
          onHighlightClick={handleHighlightClick}
          fieldStyles={fieldStyles}
        />
      ) : (
        <StudyClient
          cards={cards}
          subChapterId={subChapterId}
          bookType={bookType}
          bookSubType={bookSubType}
          annotations={annotations}
          setAnnotations={setAnnotations}
          fieldStyles={fieldStyles}
          menuState={menuState}
          setMenuState={setMenuState}
          activeFillCardId={activeFillCardId}
          setActiveFillCardId={setActiveFillCardId}
          fillModeCards={fillModeCards}
          setFillModeCards={setFillModeCards}
          fillAnswerHistory={fillAnswerHistory}
          setFillAnswerHistory={setFillAnswerHistory}
          saveFillAnswerHistory={saveFillAnswerHistory}
          initialCardIndex={initialCardIndex}
          spellingModalOpen={!!spellingModal?.show}
        />
      )}

      {/* 词典弹窗 */}
      {dictModal?.show && (
        <DictModal
          word={dictModal.word}
          show={dictModal.show}
          position={dictModal.position}
          onClose={() => setDictModal(null)}
        />
      )}

      {/* 拼写弹窗 */}
      {spellingModal?.show && (
        <SpellingModal
          word={spellingModal.word}
          show={spellingModal.show}
          allWords={spellingModal.allWords}
          currentIndex={spellingModal.currentIndex}
          onWordChange={(word, index) => {
            setSpellingModal(prev => prev ? { ...prev, word, currentIndex: index } : null)
          }}
          onClose={() => setSpellingModal(null)}
        />
      )}
    </div>
  )
}
