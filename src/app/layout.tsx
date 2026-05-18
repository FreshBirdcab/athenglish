import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ErrorSuppressor } from "@/components/providers/error-suppressor"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AthEnglish",
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col bg-background`}>
        <ErrorSuppressor />
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t bg-background/80 backdrop-blur-sm py-6">
              <div className="content-container text-center text-sm text-muted-foreground space-y-1">
                <p>© 2026 AthEnglish. All rights reserved.</p>
                <p className="text-xs">
                  联系作者：<a href="mailto:l320334928@163.com" className="hover:text-primary transition-colors">l320334928@163.com</a>
                </p>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
