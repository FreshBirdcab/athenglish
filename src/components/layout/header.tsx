"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, LogOut, Sparkles, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/providers/theme-provider"

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { theme, toggleTheme } = useTheme()

  // 管理后台不显示全局 Header
  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md">
      {/* 顶部装饰线 */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      <div className="content-container flex h-16 items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7">
              <Image
                src="/icon.svg"
                alt="AthEnglish"
                width={28}
                height={28}
                className="transition-transform group-hover:scale-110"
              />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text">AthEnglish</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/books" className="text-muted-foreground hover:text-foreground transition-colors relative group">
              全部书籍
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            {session && (
              <>
                <Link href="/favorites" className="text-muted-foreground hover:text-foreground transition-colors relative group">
                  我的收藏
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
                <Link href="/progress" className="text-muted-foreground hover:text-foreground transition-colors relative group">
                  学习进度
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* 暗夜模式切换 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-9 h-9 p-0 hover:bg-primary/10"
            title={theme === "dark" ? "切换到亮色模式" : "切换到暗夜模式"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {session ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hover:bg-primary/5">
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  登录
                </Link>
              </Button>
              <Button size="sm" asChild className="btn-gradient hover:!text-black">
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
