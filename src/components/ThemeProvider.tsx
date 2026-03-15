"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ 
  children, 
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const root = window.document.documentElement

    // Always apply the configured theme (dark). Never let localStorage override it.
    const applyTheme = (newTheme: Theme) => {
      if (disableTransitionOnChange) {
        root.style.transition = "none"
        setTimeout(() => { root.style.transition = "" }, 0)
      }

      if (newTheme === "system" && enableSystem) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        root.classList.remove("light", "dark", "system")
        root.classList.add(systemTheme)
        setResolvedTheme(systemTheme)
      } else {
        const resolved = (newTheme === "system") ? "dark" : newTheme as "dark" | "light"
        root.classList.remove("light", "dark", "system")
        root.classList.add(resolved)
        setResolvedTheme(resolved)
      }
    }

    // Sync localStorage and always force-apply the current theme
    localStorage.setItem("theme", theme)
    applyTheme(theme)

    if (enableSystem) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        if (theme === "system") applyTheme("system")
      }
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, enableSystem, disableTransitionOnChange])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
