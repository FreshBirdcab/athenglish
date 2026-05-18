"use client"

import { useEffect, useRef } from "react"
import { renderHighlightedText, type HighlightAnnotation } from "@/lib/render-highlighted-text"

interface Card {
  id: string
  contentPrimary: string
  contentSecondary: string | null
  usageNote: string | null
  exampleEn: string | null
  exampleZh: string | null
  analysis: string | null
}

interface SubChapterInfo {
  name: string
  chapterName: string
  bookName: string
  bookType: string
  cardCount: number
}

interface ExportContentProps {
  cards: Card[]
  subChapter: SubChapterInfo
  annotations: Record<string, HighlightAnnotation[]>
}

export function ExportContent({ cards, subChapter, annotations }: ExportContentProps) {
  const hasTriggeredRef = useRef(false)

  // 隐藏布局元素
  useEffect(() => {
    document.body.classList.add("export-body")
    return () => document.body.classList.remove("export-body")
  }, [])

  // 自动触发打印
  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      setTimeout(() => {
        window.print()
      }, 300)
    }
  }, [])

  // 监听打印完成事件
  useEffect(() => {
    const handleAfterPrint = () => {
      window.close()
    }
    window.addEventListener("afterprint", handleAfterPrint)
    return () => window.removeEventListener("afterprint", handleAfterPrint)
  }, [])

  return (
    <div className="export-container">
      {/* 页眉 */}
      <div className="export-header">
        <h1>{subChapter.name}</h1>
        <p className="subtitle">
          {subChapter.bookName} · {subChapter.chapterName} · {subChapter.cardCount} 张卡片
        </p>
      </div>

      {/* 卡片列表 */}
      {cards.map((card, index) => {
        const cardAnnotations = annotations[card.id] || []
        const { bookType } = subChapter

        return (
          <div key={card.id} className="export-card">
            <div className="export-card-header">
              <span className="export-card-badge">{index + 1}</span>
            </div>

            <div className="export-card-fields">
              {/* 词汇卡片 */}
              {bookType === "vocabulary" && (
                <>
                  <div className="export-field-primary">
                    {renderHighlightedText(card.contentPrimary, cardAnnotations, "primary")}
                  </div>
                  {card.contentSecondary && (
                    <div className="export-field-secondary">
                      {renderHighlightedText(card.contentSecondary, cardAnnotations, "secondary")}
                    </div>
                  )}
                  {card.usageNote && (
                    <div className="export-field-usage">
                      {renderHighlightedText(card.usageNote, cardAnnotations, "usageNote")}
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="export-field-example-en">
                      {renderHighlightedText(card.exampleEn, cardAnnotations, "exampleEn")}
                    </div>
                  )}
                  {card.exampleZh && (
                    <div className="export-field-example-zh">
                      {renderHighlightedText(card.exampleZh, cardAnnotations, "exampleZh")}
                    </div>
                  )}
                </>
              )}

              {/* 句型卡片 */}
              {bookType === "sentence" && (
                <>
                  <div className="export-field-primary">
                    {renderHighlightedText(card.contentPrimary, cardAnnotations, "primary")}
                  </div>
                  {card.contentSecondary && (
                    <div className="export-field-secondary">
                      {renderHighlightedText(card.contentSecondary, cardAnnotations, "secondary")}
                    </div>
                  )}
                  {card.usageNote && (
                    <div className="export-field-usage">
                      {renderHighlightedText(card.usageNote, cardAnnotations, "usageNote")}
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="export-field-example-en">
                      {renderHighlightedText(card.exampleEn, cardAnnotations, "exampleEn")}
                    </div>
                  )}
                  {card.exampleZh && (
                    <div className="export-field-example-zh">
                      {renderHighlightedText(card.exampleZh, cardAnnotations, "exampleZh")}
                    </div>
                  )}
                </>
              )}

              {/* 语料卡片 */}
              {bookType === "corpus" && (
                <>
                  <div className="export-field-primary">
                    {renderHighlightedText(card.contentPrimary, cardAnnotations, "primary")}
                  </div>
                  {card.contentSecondary && (
                    <div className="export-field-secondary">
                      {renderHighlightedText(card.contentSecondary, cardAnnotations, "secondary")}
                    </div>
                  )}
                  {card.usageNote && (
                    <div className="export-field-usage">
                      {renderHighlightedText(card.usageNote, cardAnnotations, "usageNote")}
                    </div>
                  )}
                  {card.exampleEn && (
                    <div className="export-field-example-en">
                      {renderHighlightedText(card.exampleEn, cardAnnotations, "exampleEn")}
                    </div>
                  )}
                  {card.exampleZh && (
                    <div className="export-field-example-zh">
                      {renderHighlightedText(card.exampleZh, cardAnnotations, "exampleZh")}
                    </div>
                  )}
                  {card.analysis && (
                    <div className="export-field-analysis">
                      {renderHighlightedText(card.analysis, cardAnnotations, "analysis")}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* 页脚 */}
      <div className="export-footer">
        由 AthEnglish 导出
      </div>
    </div>
  )
}
