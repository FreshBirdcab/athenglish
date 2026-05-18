"use client"

import { useState, useEffect } from "react"
import { Volume2, X, Loader2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { playYoudaoAudio } from "@/lib/sounds"
import { useTheme } from "@/components/providers/theme-provider"

interface DictModalProps {
  word: string
  show: boolean
  onClose: () => void
  position?: { x: number; y: number }
}

interface EnglishDictionaryEntry {
  word: string
  phonetic?: string
  phonetics: { text?: string; audio?: string }[]
  meanings: {
    partOfSpeech: string
    definitions: {
      definition: string
      example?: string
    }[]
  }[]
}

interface ChineseEntry {
  word: string
  phonetic?: string
  translations: string
}

// 模块级缓存
const englishDictCache: Record<string, EnglishDictionaryEntry> = {}
const chineseDictCache: Record<string, ChineseEntry> = {}

export function DictModal({ word, show, onClose, position }: DictModalProps) {
  const [chineseData, setChineseData] = useState<ChineseEntry | null>(null)
  const [englishData, setEnglishData] = useState<EnglishDictionaryEntry | null>(null)
  const [chineseLoading, setChineseLoading] = useState(false)
  const [englishLoading, setEnglishLoading] = useState(false)
  const [chineseError, setChineseError] = useState<string | null>(null)
  const [englishError, setEnglishError] = useState<string | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!show || !word) return

    const lowerWord = word.toLowerCase()

    // 重置状态
    setChineseData(null)
    setEnglishData(null)
    setChineseError(null)
    setEnglishError(null)

    // 播放发音
    playYoudaoAudio(word)

    // 加载中文词典（从有道）
    loadChineseDict(lowerWord, word)

    // 加载英文词典
    loadEnglishDict(lowerWord, word)
  }, [show, word])

  const loadChineseDict = (lowerWord: string, originalWord: string) => {
    if (chineseDictCache[lowerWord]) {
      setChineseData(chineseDictCache[lowerWord])
      return
    }

    setChineseLoading(true)
    fetch(`/api/chinese-dict?word=${encodeURIComponent(originalWord)}`)
      .then(res => res.json())
      .then(data => {
        if (data.translations) {
          const entry: ChineseEntry = {
            word: lowerWord,
            translations: data.translations
          }
          chineseDictCache[lowerWord] = entry
          setChineseData(entry)
        } else {
          setChineseError('未找到')
        }
        setChineseLoading(false)
      })
      .catch(() => {
        setChineseError('查询失败')
        setChineseLoading(false)
      })
  }

  const loadEnglishDict = (lowerWord: string, originalWord: string) => {
    if (englishDictCache[lowerWord]) {
      setEnglishData(englishDictCache[lowerWord])
      return
    }

    setEnglishLoading(true)
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(originalWord)}`)
      .then(res => {
        if (!res.ok) throw new Error("Word not found")
        return res.json()
      })
      .then(result => {
        const entry: EnglishDictionaryEntry = {
          word: result[0].word,
          phonetic: result[0].phonetic || result[0].phonetics?.[0]?.text,
          phonetics: result[0].phonetics || [],
          meanings: result[0].meanings || []
        }
        englishDictCache[lowerWord] = entry
        setEnglishData(entry)
        setEnglishLoading(false)
      })
      .catch(() => {
        setEnglishError('未找到')
        setEnglishLoading(false)
      })
  }

  const isLoading = chineseLoading || englishLoading

  if (!show) return null

  // 计算弹窗位置
  const modalStyle = position
    ? {
        position: "fixed" as const,
        left: Math.min(position.x, window.innerWidth - 460),
        top: Math.min(position.y + 10, window.innerHeight - 560),
        zIndex: 100,
      }
    : {
        position: "fixed" as const,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 100,
      }

  return (
    <>
      {/* 半透明背景 */}
      <div
        className="fixed inset-0 bg-black/30 z-[62]"
        onClick={onClose}
        onMouseDown={(e) => e.stopPropagation()}
      />

      {/* 弹窗内容 - 磨砂玻璃风格 */}
      <div
        className="fixed w-[450px] max-h-[550px] overflow-auto rounded-lg"
        style={{
          ...modalStyle,
          background: theme === 'dark'
            ? 'rgba(220, 30%, 6%, 0.9)'
            : 'rgba(255, 252, 248, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: theme === 'dark'
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.1)',
          boxShadow: theme === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="text-xl flex items-center gap-2">
              {isLoading ? (
                <span className="text-muted-foreground text-base flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  加载中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {word}
                  {englishData?.phonetic && (
                    <span className="text-sm text-muted-foreground font-normal">
                      {englishData.phonetic}
                    </span>
                  )}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          {/* 发音按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 mb-3"
            onClick={() => playYoudaoAudio(word)}
          >
            <Volume2 className="h-4 w-4" />
            发音
          </Button>

          {/* 中文释义 */}
          {chineseLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Globe className="h-4 w-4" />
              加载中文释义...
            </div>
          )}

          {chineseData && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">中文释义</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {chineseData.translations}
              </p>
            </div>
          )}

          {chineseError && !chineseLoading && (
            <div className="text-sm text-muted-foreground mb-3">
              {chineseError}
            </div>
          )}

          {/* 英文词典 */}
          {englishLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Globe className="h-4 w-4" />
              加载英文释义...
            </div>
          )}

          {englishData && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">English Definition</span>
              </div>
              {englishData.meanings.map((meaning, idx) => (
                <div key={idx} className="mb-2">
                  <span className="text-sm font-semibold text-primary bg-secondary px-2 py-0.5 rounded">
                    {meaning.partOfSpeech}
                  </span>
                  <ul className="text-sm space-y-1 pl-3 mt-1">
                    {meaning.definitions.slice(0, 3).map((def, defIdx) => (
                      <li key={defIdx} className="text-muted-foreground">
                        <span className="text-foreground">{def.definition}</span>
                        {def.example && (
                          <p className="text-xs italic text-muted-foreground/70 mt-0.5">
                            &ldquo;{def.example}&rdquo;
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {englishError && !englishLoading && (
            <div className="text-sm text-muted-foreground">
              英文释义未找到
            </div>
          )}

          {/* 两个词典都加载失败 */}
          {!isLoading && !chineseData && !englishData && (
            <p className="text-sm text-muted-foreground text-center py-4">
              未找到 &ldquo;{word}&rdquo; 的释义
            </p>
          )}
        </div>
      </div>
    </>
  )
}
