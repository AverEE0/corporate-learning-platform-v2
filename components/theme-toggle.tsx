"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      setMounted(true)
      // Проверяем сохраненную тему или системную
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const currentTheme = savedTheme || systemTheme
        
        setTheme(currentTheme)
        applyTheme(currentTheme)
      }
    } catch (error) {
      console.error('Error initializing theme:', error)
    }
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    try {
      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', newTheme)
        }
      }
    } catch (error) {
      console.error('Error applying theme:', error)
    }
  }

  const toggleTheme = () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      applyTheme(newTheme)
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  // Всегда возвращаем кнопку, даже если не mounted
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
      disabled={!mounted}
    >
      {!mounted ? (
        <Sun className="h-5 w-5" />
      ) : theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}

