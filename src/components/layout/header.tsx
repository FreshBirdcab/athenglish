"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BookOpen, User, LogOut } from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
      <div className="content-container flex h-16 items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AthEnglish</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/books" className="text-muted-foreground hover:text-foreground transition-colors">
              全部书籍
            </Link>
            {session && (
              <>
                <Link href="/favorites" className="text-muted-foreground hover:text-foreground transition-colors">
                  我的收藏
                </Link>
                <Link href="/progress" className="text-muted-foreground hover:text-foreground transition-colors">
                  学习进度
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          {session ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <User className="h-4 w-4 mr-2" />
                  登录
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
