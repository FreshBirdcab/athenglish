"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Layout, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StudyClient } from "@/components/learn/study-client"
import { StudyList } from "@/components/learn/study-list"

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
}

const HIGHLIGHT_COLORS = [
  { name: "黄色", value: "#fef08a", label: "yellow" },
  { name: "绿色", value: "#bbf7d0", label: "green" },
  { name: "蓝色", value: "#bfdbfe", label: "blue" },
  { name: "粉色", value: "#fbcfe8", label: "pink" },
  { name: "橙色", value: "#fed7aa", label: "orange" },
]

export function StudyModeWrapper({ cards, subChapterId, bookType, bookSubType, fieldStyles }: StudyModeWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
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

  // 挖空模式相关状态
  const [fillModeCards, setFillModeCards] = useState<Record<string, Record<number, { input: string; checked: boolean; isCorrect: boolean | null }>>>({})
  const [activeFillCardId, setActiveFillCardId] = useState<string | null>(null)
  const [fillAnswerHistory, setFillAnswerHistory] = useState<Record<string, { correct: number; incorrect: number }>>({})

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuState?.show && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuState(null)
        window.getSelection()?.removeAllRanges()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuState?.show])

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
        }
      }
    } catch (error) {
      console.error("高亮操作失败:", error)
    }

    setMenuState(null)
    window.getSelection()?.removeAllRanges()
  }, [session, menuState])

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
        }
      }
    } catch (error) {
      console.error("备注操作失败:", error)
    }

    setMenuState(null)
    setNoteInput("")
    window.getSelection()?.removeAllRanges()
  }, [session, menuState, noteInput, annotations])

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
          className="fixed z-50 bg-white rounded-lg shadow-lg border p-3 flex flex-col gap-2 min-w-[200px]"
          style={{
            left: menuState.position.x,
            top: menuState.position.y,
            transform: 'translate(-50%, -100%)'
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
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleNote} className="h-8">
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
        />
      )}
    </div>
  )
}
