"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Layout, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

interface StudyModeWrapperProps {
  cards: Card[]
  subChapterId: string
  bookType: string
  bookSubType: string | null
}

const HIGHLIGHT_COLORS = [
  { name: "黄色", value: "#fef08a", label: "yellow" },
  { name: "绿色", value: "#bbf7d0", label: "green" },
  { name: "蓝色", value: "#bfdbfe", label: "blue" },
  { name: "粉色", value: "#fbcfe8", label: "pink" },
  { name: "橙色", value: "#fed7aa", label: "orange" },
]

export function StudyModeWrapper({ cards, subChapterId, bookType, bookSubType }: StudyModeWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const mode = searchParams.get("mode") || "card"

  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({})
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number; field: string; cardId: string } | null>(null)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  // 加载所有卡片的批注
  useEffect(() => {
    if (session?.user && cards.length > 0) {
      // 批量加载所有卡片的批注
      const cardIds = cards.map(c => c.id)
      Promise.all(
        cardIds.map(cardId =>
          fetch(`/api/annotations?cardId=${cardId}`)
            .then(res => res.json())
            .then(data => ({ cardId, annotations: data.annotations || [] }))
        )
      ).then(results => {
        const annotationsMap: Record<string, Annotation[]> = {}
        results.forEach(({ cardId, annotations }) => {
          annotationsMap[cardId] = annotations
        })
        setAnnotations(annotationsMap)
      }).catch(console.error)
    }
  }, [session, cards])

  const toggleMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newMode)
    router.push(`?${params.toString()}`)
  }

  // 添加高亮
  const handleAddHighlight = useCallback(async (color: string) => {
    if (!session?.user || !selectedText) return

    // 检查是否与已有的高亮重叠（只检查有 highlight 的批注）
    const existingAnnotations = annotations[selectedText.cardId] || []
    const fieldAnnotations = existingAnnotations.filter(
      (a: Annotation) => a.field === selectedText.field && a.highlight
    )
    const isOverlapping = fieldAnnotations.some((a: Annotation) =>
      !(selectedText.end <= a.startOffset || selectedText.start >= a.endOffset)
    )

    if (isOverlapping) {
      alert("该区域已有高亮，请选择其他区域")
      setShowMenu(false)
      window.getSelection()?.removeAllRanges()
      return
    }

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedText.cardId,
          startOffset: selectedText.start,
          endOffset: selectedText.end,
          highlight: color,
          field: selectedText.field
        })
      })
      const data = await res.json()
      if (data.annotation) {
        setAnnotations(prev => ({
          ...prev,
          [selectedText.cardId]: [...(prev[selectedText.cardId] || []), { ...data.annotation, field: selectedText.field }]
        }))
      }
    } catch (error) {
      console.error("添加高亮失败:", error)
    }

    setShowMenu(false)
    window.getSelection()?.removeAllRanges()
  }, [session, selectedText, annotations])

  // 添加批注
  const handleAddNote = useCallback(async () => {
    if (!session?.user || !selectedText || !noteText.trim()) return

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedText.cardId,
          startOffset: selectedText.start,
          endOffset: selectedText.end,
          note: noteText.trim(),
          field: selectedText.field
        })
      })
      const data = await res.json()
      if (data.annotation) {
        setAnnotations(prev => ({
          ...prev,
          [selectedText.cardId]: [...(prev[selectedText.cardId] || []), { ...data.annotation, field: selectedText.field }]
        }))
      }
    } catch (error) {
      console.error("添加批注失败:", error)
    }

    setShowNoteInput(false)
    setNoteText("")
    setShowMenu(false)
    window.getSelection()?.removeAllRanges()
  }, [session, selectedText, noteText])

  // 删除批注
  const handleDeleteAnnotation = useCallback(async (cardId: string, annotationId: string) => {
    try {
      await fetch(`/api/annotations?id=${annotationId}`, { method: "DELETE" })
      setAnnotations(prev => ({
        ...prev,
        [cardId]: prev[cardId].filter((a: Annotation) => a.id !== annotationId)
      }))
    } catch (error) {
      console.error("删除批注失败:", error)
    }
  }, [])

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

      {/* 高亮/批注菜单 - 两个模式共用 */}
      {showMenu && selectedText && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border p-2 flex gap-1"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color.label}
              onClick={() => handleAddHighlight(color.value)}
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
          <Popover open={showNoteInput} onOpenChange={setShowNoteInput}>
            <PopoverTrigger asChild>
              <button
                onClick={() => { setShowNoteInput(true); }}
                className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform"
                title="添加批注"
              >
                <svg className="w-3 h-3 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64" side="top">
              <div className="space-y-2">
                <p className="text-sm font-medium">添加批注</p>
                <Input
                  placeholder="输入批注内容..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <Button size="sm" onClick={handleAddNote} className="w-full">保存</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 根据模式渲染不同组件 */}
      {mode === "list" ? (
        <StudyList
          cards={cards}
          bookType={bookType}
          annotations={annotations}
          onTextSelect={(cardId, text, start, end, field, position) => {
            setSelectedText({ text, start, end, field, cardId })
            setMenuPosition(position)
            setShowMenu(true)
          }}
          onDeleteAnnotation={handleDeleteAnnotation}
        />
      ) : (
        <StudyClient
          cards={cards}
          subChapterId={subChapterId}
          bookType={bookType}
          bookSubType={bookSubType}
          annotations={annotations}
          setAnnotations={setAnnotations}
          selectedText={selectedText}
          setSelectedText={setSelectedText}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          menuPosition={menuPosition}
          setMenuPosition={setMenuPosition}
          showNoteInput={showNoteInput}
          setShowNoteInput={setShowNoteInput}
          noteText={noteText}
          setNoteText={setNoteText}
          onAddHighlight={handleAddHighlight}
          onAddNote={handleAddNote}
          onDeleteAnnotation={handleDeleteAnnotation}
        />
      )}
    </div>
  )
}
