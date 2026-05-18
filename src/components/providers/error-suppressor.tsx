"use client"

import { useEffect } from "react"

// 阻止 Next.js RSC 请求失败导致的自动刷新
export function ErrorSuppressor() {
  useEffect(() => {
    // 拦截 fetch 请求错误，防止自动刷新
    const originalFetch = window.fetch
    window.fetch = async (...args: [RequestInfo | URL, RequestInit?]) => {
      try {
        const response = await originalFetch(...args)
        return response
      } catch (error) {
        // 阻止 fetch 错误冒泡导致页面刷新
        console.warn('Fetch error suppressed:', error)
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
