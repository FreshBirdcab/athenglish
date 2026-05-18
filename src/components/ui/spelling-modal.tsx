"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "@/components/providers/theme-provider"
import { Volume2, BookOpen, X, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { playYoudaoAudio } from "@/lib/sounds"

interface SpellingWord {
  word: string
  cardId: string
  start: number
  end: number
}

interface SpellingModalProps {
  word: string
  show: boolean
  onClose: () => void
  allWords?: SpellingWord[]
  currentIndex?: number
  onWordChange?: (word: string, index: number) => void
}

type Phase = "showing" | "typing" | "revealed"

export function SpellingModal({
  word,
  show,
  onClose,
  allWords = [],
  currentIndex = 0,
  onWordChange
}: SpellingModalProps) {
  const [phase, setPhase] = useState<Phase>("showing")
  const [input, setInput] = useState<string[]>([])
  const [revealedChars, setRevealedChars] = useState<(boolean | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(currentIndex)
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()

  const targetWord = word.toLowerCase()

  // 预计算字母位置映射（用于处理带连字符/空格的单词）
  const letterPositions = targetWord.split("").reduce<{ char: string; charIndex: number; letterIndex: number }[]>(
    (acc, char, charIndex) => {
      if (/[a-zA-Z]/.test(char)) {
        acc.push({ char, charIndex, letterIndex: acc.filter(a => /[a-zA-Z]/.test(a.char)).length })
      }
      return acc
    },
    []
  )

  // 重置状态
  useEffect(() => {
    if (show) {
      setPhase("showing")
      setInput([])
      setRevealedChars([])
      setActiveIndex(currentIndex)
    }
  }, [show, word, currentIndex])

  // 自动聚焦输入框
  useEffect(() => {
    if (phase === "typing" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase])

  // 监听键盘事件
  useEffect(() => {
    if (!show) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        if (phase === "showing") {
          setPhase("typing")
          setInput(new Array(targetWord.length).fill(""))
          setRevealedChars(new Array(targetWord.length).fill(null))
          playYoudaoAudio(word)
        } else if (phase === "typing") {
          setPhase("revealed")
          playYoudaoAudio(word)
        } else if (phase === "revealed") {
          setPhase("showing")
          setInput([])
          setRevealedChars([])
        }
      } else if (e.key === "Tab") {
        e.preventDefault()
        e.stopPropagation()
        playYoudaoAudio(word)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        e.stopPropagation()
        // 切换到上一个词（循环）
        if (allWords.length > 1) {
          const newIndex = activeIndex === 0 ? allWords.length - 1 : activeIndex - 1
          setActiveIndex(newIndex)
          onWordChange?.(allWords[newIndex].word, newIndex)
          setPhase("showing")
          setInput([])
          setRevealedChars([])
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        e.stopPropagation()
        // 切换到下一个词（循环）
        if (allWords.length > 1) {
          const newIndex = activeIndex === allWords.length - 1 ? 0 : activeIndex + 1
          setActiveIndex(newIndex)
          onWordChange?.(allWords[newIndex].word, newIndex)
          setPhase("showing")
          setInput([])
          setRevealedChars([])
        }
      } else if ((e.key === "p" || e.key === "P")) {
        // P 键关闭弹窗（只在不在输入框时生效）
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT') {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }
      } else if (e.key === "Alt") {
        e.preventDefault()
        e.stopPropagation()
        handleDictToggle()
      }
    }

    document.addEventListener("keydown", handleKeyDown, true) // capture phase to intercept before study-client
    return () => document.removeEventListener("keydown", handleKeyDown, true)
  }, [show, phase, targetWord, word, allWords, activeIndex, onWordChange])

  // 处理键盘输入（typing 阶段）
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (phase === "typing") {
        setPhase("revealed")
        playYoudaoAudio(word)
      } else if (phase === "revealed") {
        setPhase("showing")
        setInput([])
        setRevealedChars([])
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      playYoudaoAudio(word)
    }
  }, [phase, word])

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.toLowerCase()
    if (value.length > 0) {
      const char = value[value.length - 1]
      const newInput = [...input]
      newInput[index] = char
      setInput(newInput)

      // 实时更新颜色
      const targetChar = letterPositions[index]?.char
      if (targetChar) {
        const newRevealed = [...revealedChars]
        newRevealed[index] = char === targetChar
        setRevealedChars(newRevealed)
      }

      // 自动聚焦下一个输入框
      const inputs = document.querySelectorAll(".spelling-input")
      const nextInput = inputs[index + 1] as HTMLInputElement
      if (nextInput && index < letterPositions.length - 1) {
        nextInput.focus()
      }
    }
  }, [input, revealedChars, letterPositions])

  const handleDictLookup = () => {
    window.dispatchEvent(new CustomEvent("spelling-dict-lookup", { detail: { word } }))
  }

  const handleDictToggle = () => {
    window.dispatchEvent(new CustomEvent("spelling-dict-toggle", { detail: { word } }))
  }

  if (!show) return null

  const isDark = theme === 'dark'

  return (
    <>
      {/* 半透明背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
        onClick={onClose}
        onMouseDown={(e) => e.stopPropagation()}
      />

      {/* 弹窗内容 - 磨砂玻璃风格 */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[600px] z-[61] rounded-2xl overflow-hidden shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: isDark
            ? 'hsla(222, 25%, 10%, 0.88)'
            : 'hsla(220, 20%, 97%, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.06)',
          boxShadow: isDark
            ? '0 25px 60px rgba(0,0,0,0.5)'
            : '0 25px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center gap-3">
            {/* 图标 - 主题蓝色渐变 */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, hsl(210, 38%, 42%) 0%, hsl(215, 28%, 36%) 100%)'
                  : 'linear-gradient(135deg, hsl(222, 38%, 36%) 0%, hsl(210, 32%, 44%) 100%)',
                boxShadow: isDark
                  ? '0 2px 8px hsla(210, 38%, 56%, 0.15)'
                  : '0 2px 8px hsla(222, 38%, 30%, 0.18)',
              }}
            >
              <Type className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">
                拼写练习
              </span>
              {allWords.length > 1 && (
                <span className="text-xs ml-2 text-muted-foreground">
                  ({activeIndex + 1}/{allWords.length})
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="p-5">
          {/* 操作按钮 */}
          <div className="flex gap-2 mb-6 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-secondary/60 border-border text-foreground hover:bg-secondary hover:text-foreground
                         dark:bg-secondary/40 dark:border-border dark:text-foreground dark:hover:bg-secondary/60 dark:hover:text-foreground"
              onClick={() => playYoudaoAudio(word)}
            >
              <Volume2 className="h-4 w-4" />
              发音 (Tab)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-secondary/60 border-border text-foreground hover:bg-secondary hover:text-foreground
                         dark:bg-secondary/40 dark:border-border dark:text-foreground dark:hover:bg-secondary/60 dark:hover:text-foreground"
              onClick={handleDictLookup}
            >
              <BookOpen className="h-4 w-4" />
              词典
            </Button>
          </div>

          {/* 显示单词 */}
          {phase === "showing" && (
            <div className="text-center">
              <div
                className="text-4xl font-bold tracking-wider mb-6 break-all leading-tight"
                style={{
                  color: isDark ? 'hsl(210, 38%, 64%)' : 'hsl(222, 38%, 30%)',
                }}
              >
                {word}
              </div>
              <p className="text-sm mb-4 text-muted-foreground">
                按回车开始拼写
              </p>
              {allWords.length > 1 && (
                <p className="text-xs text-muted-foreground/70">
                  ← → 切换词汇
                </p>
              )}
            </div>
          )}

          {/* 输入下划线 */}
          {phase === "typing" && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-0 mb-6">
                {targetWord.split("").map((char, charIndex) => {
                  const letterData = letterPositions.find(l => l.charIndex === charIndex)
                  if (letterData) {
                    // 是字母，显示输入框
                    const charState = revealedChars[letterData.letterIndex]
                    return (
                      <input
                        key={charIndex}
                        ref={letterData.letterIndex === 0 ? inputRef : undefined}
                        type="text"
                        maxLength={1}
                        value={input[letterData.letterIndex] || ""}
                        onChange={(e) => handleInputChange(e, letterData.letterIndex)}
                        onKeyDown={handleInputKeyDown}
                        className={`spelling-input w-8 h-12 text-2xl text-center font-bold border-b-2 transition-colors bg-transparent mx-[1px] outline-none
                          ${charState === true ? "text-emerald-600 border-emerald-500 dark:text-emerald-400 dark:border-emerald-500" : ""}
                          ${charState === false ? "text-red-500 border-red-500" : ""}
                          ${charState === null ? "text-foreground border-muted-foreground/40" : ""}
                        `}
                      />
                    )
                  } else {
                    // 非字母字符（连字符、空格等）直接显示
                    return (
                      <span
                        key={charIndex}
                        className="w-8 h-12 text-2xl font-bold flex items-center justify-center text-muted-foreground/50"
                      >
                        {char}
                      </span>
                    )
                  }
                })}
              </div>
              <p className="text-sm mb-4 text-muted-foreground">
                填写字符后自动跳转，全部填完或按回车显示答案
              </p>
            </div>
          )}

          {/* 显示答案 */}
          {phase === "revealed" && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-0 mb-6">
                {targetWord.split("").map((char, charIndex) => {
                  const letterData = letterPositions.find(l => l.charIndex === charIndex)
                  if (letterData) {
                    const isCorrect = input[letterData.letterIndex] === char
                    return (
                      <span
                        key={charIndex}
                        className={`w-8 h-12 text-2xl font-bold flex items-center justify-center border-b-2 mx-[1px]
                          ${isCorrect
                            ? "text-emerald-600 border-emerald-500 dark:text-emerald-400 dark:border-emerald-500"
                            : "text-red-500 border-red-500"
                          }
                        `}
                      >
                        {char.toUpperCase()}
                      </span>
                    )
                  } else {
                    return (
                      <span
                        key={charIndex}
                        className="w-8 h-12 text-2xl font-bold flex items-center justify-center text-muted-foreground/50"
                      >
                        {char}
                      </span>
                    )
                  }
                })}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                按回车重新开始
              </p>
            </div>
          )}

          {/* 底部快捷键提示 */}
          <div className="text-center text-xs mt-4 text-muted-foreground/60">
            回车继续 | Tab 发音 | ← → 切换词汇 | Alt 开关词典 | P 退出
          </div>
        </div>
      </div>
    </>
  )
}
