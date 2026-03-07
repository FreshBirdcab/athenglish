"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, LogOut, Sparkles } from "lucide-react"

// 古希腊猫头鹰图标 (用于 Header)
function HeaderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      <ellipse cx="50" cy="40" rx="22" ry="18" fill="currentColor" className="text-amber-600" />
      <ellipse cx="50" cy="44" rx="15" ry="12" fill="currentColor" className="text-amber-100" />
      <circle cx="43" cy="42" r="5" fill="#1f2937" />
      <circle cx="57" cy="42" r="5" fill="#1f2937" />
      <circle cx="44" cy="40" r="1.5" fill="white" />
      <circle cx="58" cy="40" r="1.5" fill="white" />
      <polygon points="50,45 47,50 53,50" fill="currentColor" className="text-amber-600" />
      <ellipse cx="50" cy="70" rx="25" ry="18" fill="currentColor" className="text-amber-600" />
      <ellipse cx="50" cy="72" rx="18" ry="13" fill="currentColor" className="text-amber-100" />
      <path d="M20 58 Q25 55 28 58" stroke="currentColor" strokeWidth="2" fill="none" className="text-green-600" />
    </svg>
  )
}

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
      {/* 顶部装饰线 */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

      <div className="content-container flex h-16 items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <HeaderIcon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text">AthEnglish</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">· 雅典英语</span>
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

        <div className="flex flex-1 items-center justify-end gap-4">
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
                className="hover:bg-primary/5"
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
              <Button size="sm" asChild className="btn-gradient">
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
