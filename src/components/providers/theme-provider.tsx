"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 从 localStorage 读取主题，如果没有则默认暗色
    const savedTheme = localStorage.getItem("theme") as Theme | null
    const theme = savedTheme || "dark"
    setThemeState(theme)
    document.documentElement.setAttribute("data-theme", theme)
    // 如果没有保存过主题，则默认保存暗色
    if (!savedTheme) {
      localStorage.setItem("theme", "dark")
    }
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return a default value during SSR or if not within provider
  if (context === undefined) {
    return {
      theme: "dark" as Theme,
      toggleTheme: () => {},
      setTheme: () => {}
    }
  }
  return context
}
