"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, BookOpen, LogOut, Moon, Sun } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    // 从 localStorage 读取主题
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if ((session?.user as any)?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="bg-card border-b shadow-sm">
        <div className="content-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-primary">
                管理后台
              </Link>
              <nav className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  仪表盘
                </Link>
                <Link
                  href="/admin/books"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  书籍管理
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {/* 主题切换按钮 - 显示当前模式 */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-background hover:bg-muted hover:text-foreground transition-colors"
                title={theme === "dark" ? "当前暗色模式，点击切换" : "当前亮色模式，点击切换"}
              >
                {theme === "light" ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <span className="text-sm text-muted-foreground">
                {(session?.user as any)?.name || (session?.user as any)?.email}
              </span>
              <Link
                href="/api/auth/signout"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                退出
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="content-container py-8">
        {children}
      </main>
    </div>
  )
}
