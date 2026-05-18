import React from "react"

interface Annotation {
  id: string
  startOffset: number
  endOffset: number
  highlight: string | null
  note: string | null
  field: string
}

export type HighlightAnnotation = Annotation

/**
 * 处理文本中的换行符，转换为 <br />
 */
function processNewlines(content: string): React.ReactNode {
  if (!content.includes('\n')) return content
  return content.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ))
}

/**
 * 渲染带高亮批注的文本
 * @param text 原始文本
 * @param cardAnnotations 当前卡片的所有批注
 * @param field 当前字段名（primary/secondary/usageNote/exampleEn/exampleZh/analysis）
 * @param onClick 点击高亮区域的回调（可选，导出页不需要）
 */
export function renderHighlightedText(
  text: string | null,
  cardAnnotations: Annotation[],
  field: string,
  onClick?: (annotation: Annotation) => void
): React.ReactNode {
  if (!text) return null

  // 过滤当前字段的有效批注（有高亮或有备注的）
  const validAnnotations = cardAnnotations
    .filter(a => a.field === field && (a.highlight || a.note))
    .sort((a, b) => a.startOffset - b.startOffset)

  if (validAnnotations.length === 0) {
    return processNewlines(text)
  }

  const parts: React.ReactNode[] = []
  let lastEnd = 0

  validAnnotations.forEach((ann, index) => {
    if (ann.startOffset < lastEnd) return

    // 添加批注前的普通文本
    if (ann.startOffset > lastEnd) {
      parts.push(
        <span key={`text-${field}-${index}`}>
          {processNewlines(text.slice(lastEnd, ann.startOffset))}
        </span>
      )
    }

    // 添加高亮文本
    const highlightedText = text.slice(ann.startOffset, ann.endOffset)
    parts.push(
      <span
        key={`highlight-${field}-${index}`}
        className={`px-0.5 rounded highlighted-text ${ann.note ? "border-b-2 border-dashed border-primary/60" : ""}`}
        style={{
          backgroundColor: ann.highlight && ann.highlight !== "underline" ? ann.highlight : undefined,
          textDecoration: ann.highlight === "underline" ? "underline" : undefined
        }}
        onClick={onClick ? () => onClick(ann) : undefined}
      >
        {processNewlines(highlightedText)}
      </span>
    )
    lastEnd = ann.endOffset
  })

  // 添加最后剩余的文本
  if (lastEnd < text.length) {
    parts.push(
      <span key={`text-end-${field}`}>
        {processNewlines(text.slice(lastEnd))}
      </span>
    )
  }

  return <>{parts}</>
}
