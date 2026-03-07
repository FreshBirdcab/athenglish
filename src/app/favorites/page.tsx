import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userId = (session.user as any).id

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      card: {
        include: {
          subChapter: {
            include: {
              chapter: {
                include: { book: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="content-container py-8">
      <h1 className="text-3xl font-bold mb-8">我的收藏</h1>

      {favorites.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <p>还没有收藏内容</p>
          <p className="mt-2">在学习过程中点击 ❤️ 添加收藏</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((fav) => (
            <Link key={fav.id} href={`/learn/${fav.card.subChapterId}`}>
              <Card className="card-hover glass-card cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Badge variant={fav.type === "word" ? "default" : "secondary"}>
                    {fav.type === "word" ? "生词本" : "句型库"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {fav.card.subChapter.chapter.book.name}
                  </span>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">
                    {fav.card.contentPrimary}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fav.card.contentSecondary}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
