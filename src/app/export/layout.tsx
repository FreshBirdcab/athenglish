import type { Metadata } from "next"
import "./print.css"

export const metadata: Metadata = {
  title: "导出 PDF",
  robots: "noindex,nofollow",
}

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
