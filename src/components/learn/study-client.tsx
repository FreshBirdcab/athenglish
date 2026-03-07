"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Volume2, Heart, BookOpen, Layers, PenLine, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface Card {
  id: string
  contentPrimary: string
  contentSecondary: string | null
  usageNote: string | null
  exampleEn: string | null
  exampleZh: string | null
  analysis: string | null
}

interface StudyClientProps {
  cards: Card[]
  subChapterId: string
}

// 单行卡片翻转组件
function FlipCard({ card, isFlipped, onFlip }: { card: Card; isFlipped: boolean; onFlip: () => void }) {
  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="flip-card w-full max-w-2xl mx-auto" onClick={onFlip}>
      <div className={cn("flip-card-inner relative w-full min-h-[300px]", isFlipped && "flipped")}>
        {/* 正面 */}
        <div className="flip-card-front absolute inset-0 backface-hidden">
          <Card className="h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <Badge variant="outline">单词</Badge>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); speak(card.contentPrimary); }}>
                <Volume2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[200px]">
              <CardTitle className="text-3xl text-center">{card.contentPrimary}</CardTitle>
            </CardContent>
          </Card>
        </div>
        {/* 背面 */}
        <div className="flip-card-back absolute inset-0 backface-hidden">
          <Card className="h-full">
            <CardHeader>
              <Badge variant="secondary">释义</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xl text-center font-medium">{card.contentSecondary}</p>
              {card.exampleEn && (
                <p className="text-sm italic text-muted-foreground border-l-2 pl-3 border-primary">
                  {card.exampleEn}
                </p>
              )}
              {card.exampleZh && (
                <p className="text-sm text-muted-foreground">{card.exampleZh}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// 挖空补全组件
function FillBlankCard({ card, onAnswer }: { card: Card; onAnswer: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)

  // 从contentPrimary中提取方括号内的内容作为答案
  const blanks = card.contentPrimary.match(/\[([^\]]+)\]/g) || []
  const answerText = blanks.map((b: string) => b.slice(1, -1)).join(", ")

  const checkAnswer = () => {
    const userAnswer = answer.trim().toLowerCase()
    const correct = userAnswer === answerText.toLowerCase()
    setShowResult(true)
    onAnswer(correct)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">挖空补全</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-lg">
            {card.contentPrimary.replace(/\[([^\]]+)\]/g, "_____")}
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="输入答案..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !showResult && checkAnswer()}
            disabled={showResult}
          />
          <Button onClick={checkAnswer} disabled={showResult}>检查</Button>
        </div>
        {showResult && (
          <div className={cn(
            "p-4 rounded-lg flex items-center gap-2",
            answer.toLowerCase() === answerText.toLowerCase() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}>
            {answer.toLowerCase() === answerText.toLowerCase() ? (
              <><Check className="h-4 w-4" /> 正确！</>
            ) : (
              <><X className="h-4 w-4" /> 正确答案: {answerText}</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 趣味测试 - 选择题
function QuizCard({ card, onComplete }: { card: Card; onComplete: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  // 简单的选择题实现 - 使用contentSecondary作为正确答案
  const options = [
    card.contentSecondary || "正确",
    "选项 A",
    "选项 B",
    "选项 C"
  ].slice(0, 4)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">选择题</CardTitle>
        <p className="text-sm text-muted-foreground">{card.contentPrimary} 的意思是？</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((option, i) => (
          <Button
            key={i}
            variant={selected === option ? (option === card.contentSecondary ? "default" : "destructive") : "outline"}
            className="w-full justify-start text-left h-auto py-3"
            onClick={() => { setSelected(option); setShowResult(true); }}
            disabled={showResult}
          >
            {option}
          </Button>
        ))}
        {showResult && (
          <div className="mt-4">
            <p className={cn(
              "font-medium",
              selected === card.contentSecondary ? "text-green-600" : "text-red-600"
            )}>
              {selected === card.contentSecondary ? "回答正确！" : "回答错误"}
            </p>
            <Button className="mt-2" onClick={onComplete}>下一题</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StudyClient({ cards, subChapterId }: StudyClientProps) {
  const [mode, setMode] = useState<"read" | "card" | "fill" | "quiz">("read")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState(0)

  const currentCard = cards[currentIndex]
  const total = cards.length

  const goNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(((currentIndex + 1) / total) * 100)
      setIsFlipped(false)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(((currentIndex - 1) / total) * 100)
      setIsFlipped(false)
    }
  }

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="space-y-6">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>学习进度</span>
          <span>{currentIndex + 1} / {total}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 学习模式内容 */}
      <div className="min-h-[400px]">
        {mode === "read" && currentCard && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <Badge variant="outline">#{currentIndex + 1}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => speak(currentCard.contentPrimary)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl font-normal mb-2">
                  {currentCard.contentPrimary}
                </CardTitle>
                <p className="text-muted-foreground">{currentCard.contentSecondary}</p>
                {currentCard.exampleEn && (
                  <p className="mt-3 text-sm italic border-l-2 pl-3 border-primary">
                    {currentCard.exampleEn}
                  </p>
                )}
                {currentCard.exampleZh && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentCard.exampleZh}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "card" && currentCard && (
          <FlipCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />
        )}

        {mode === "fill" && currentCard && (
          <FillBlankCard
            card={currentCard}
            onAnswer={(correct) => console.log(correct)}
          />
        )}

        {mode === "quiz" && currentCard && (
          <QuizCard
            card={currentCard}
            onComplete={goNext}
          />
        )}
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一个
        </Button>
        <div className="flex gap-2">
          <Button
            variant={mode === "read" ? "default" : "outline"}
            size="icon"
            onClick={() => { setMode("read"); setIsFlipped(false); }}
          >
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === "card" ? "default" : "outline"}
            size="icon"
            onClick={() => { setMode("card"); setIsFlipped(false); }}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === "fill" ? "default" : "outline"}
            size="icon"
            onClick={() => setMode("fill")}
          >
            <PenLine className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === "quiz" ? "default" : "outline"}
            size="icon"
            onClick={() => setMode("quiz")}
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={goNext} disabled={currentIndex === total - 1}>
          下一个
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* 快捷键提示 */}
      <div className="text-center text-xs text-muted-foreground">
        快捷键: ← → 切换卡片 | 空格 翻转 | V 发音
      </div>
    </div>
  )
}
