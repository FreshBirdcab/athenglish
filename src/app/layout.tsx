import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { AuthProvider } from "@/components/providers/auth-provider"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AthEnglish - 沉浸式语言学习平台",
  description: "专业的英语学习平台，包含词汇、句型、语料学习，支持多种学习模式和间隔重复",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col bg-white`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t bg-white/80 backdrop-blur-sm py-6">
            <div className="content-container text-center text-sm text-muted-foreground">
              © 2024 AthEnglish. All rights reserved.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
