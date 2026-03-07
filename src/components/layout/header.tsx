import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, User, Menu } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AthEnglish</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/books" className="text-muted-foreground hover:text-foreground transition-colors">
              全部书籍
            </Link>
            <Link href="/favorites" className="text-muted-foreground hover:text-foreground transition-colors">
              我的收藏
            </Link>
            <Link href="/progress" className="text-muted-foreground hover:text-foreground transition-colors">
              学习进度
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              <User className="h-4 w-4 mr-2" />
              登录
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">注册</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
