import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { prisma } from "@/lib/prisma"
import { ChevronLeft, BookOpen, Layers, PenLine, Lightbulb } from "lucide-react"

async function getSubChapter(subChapterId: string) {
  const subChapter = await prisma.subChapter.findUnique({
    where: { id: subChapterId },
    include: {
      chapter: {
        include: {
          book: true
        }
      },
      cards: {
        orderBy: { order: 'asc' }
      }
    }
  })
  return subChapter
}

export default async function LearnPage({ params }: { params: Promise<{ subChapterId: string }> }) {
  const { subChapterId } = await params
  const subChapter = await getSubChapter(subChapterId)

  if (!subChapter) {
    notFound()
  }

  const cards = subChapter.cards

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href={`/books/${subChapter.chapter.book.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          返回 {subChapter.chapter.book.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">{subChapter.name}</h1>
        <p className="text-muted-foreground">{cards.length} 张卡片</p>
      </div>

      <Tabs defaultValue="read" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="read" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            连续阅读
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            单行卡片
          </TabsTrigger>
          <TabsTrigger value="fill" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            挖空补全
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            趣味测试
          </TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card, index) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                  <CardTitle className="text-lg font-normal">
                    {card.contentPrimary}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.contentSecondary}</p>
                  {card.exampleEn && (
                    <p className="mt-3 text-sm italic border-l-2 pl-3 border-primary">
                      {card.exampleEn}
                    </p>
                  )}
                  {card.exampleZh && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {card.exampleZh}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="card">
          <Card>
            <CardHeader className="text-center">
              <Badge variant="outline" className="w-fit mx-auto mb-2">
                点击卡片翻转
              </Badge>
              <CardTitle className="text-2xl">
                {cards[0]?.contentPrimary}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-xl text-muted-foreground">
                {cards[0]?.contentSecondary}
              </p>
              {cards[0]?.exampleEn && (
                <p className="mt-4 italic">
                  {cards[0]?.exampleEn}
                </p>
              )}
              <div className="flex justify-center gap-4 mt-6">
                <Button variant="outline" size="lg">上一个</Button>
                <Button size="lg">下一个</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fill">
          <Card>
            <CardHeader>
              <CardTitle>挖空补全模式</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                选择一个句子进行挖空练习...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>趣味测试模式</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                完成学习后可解锁测试...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
