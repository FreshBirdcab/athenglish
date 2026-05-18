"use client"

import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportButtonProps {
  subChapterId: string
}

export function ExportButton({ subChapterId }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/export/${subChapterId}`, "_blank")}
      className="gap-1.5 bg-white/40 dark:bg-white/10 backdrop-blur-sm border-white/30 dark:border-white/15 hover:bg-white/60 dark:hover:bg-white/20"
    >
      <FileDown className="h-4 w-4" />
      导出 PDF
    </Button>
  )
}
