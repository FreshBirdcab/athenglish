"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, LogOut, Sparkles } from "lucide-react"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md">
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
