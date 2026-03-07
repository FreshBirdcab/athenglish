import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookClient } from "@/components/books/book-client"

async function getBook(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          subChapters: {
            orderBy: { order: 'asc' },
            include: {
              _count: {
                select: { cards: true }
              }
            }
          }
        }
      }
    }
  })
  return book
}

export default async function BookPage({ params }: { params: { bookId: string } }) {
  const bookId = decodeURIComponent(params.bookId)
  const book = await getBook(bookId)

  if (!book) {
    notFound()
  }

  return <BookClient book={book} />
}
