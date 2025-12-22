#!/usr/bin/env python3
import sys

# theme-toggle.tsx content
theme_toggle_content = '''"use client"

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
'''

notifications_bell_content = '''"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationsList } from "./notifications-list"
import { useAuth } from "@/lib/auth-context"

export function NotificationsBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!user) return

      // Загружаем количество непрочитанных уведомлений
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/notifications/unread-count')
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setUnreadCount(data.count || 0)
            }
          }
        } catch (error) {
          console.error('Error fetching unread count:', error)
          // Не устанавливаем ошибку, просто продолжаем
        }
      }

      fetchUnreadCount()

      // Обновляем каждые 30 секунд
      const interval = setInterval(fetchUnreadCount, 30000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error in NotificationsBell useEffect:', error)
    }
  }, [user])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // При открытии помечаем все как прочитанные
    if (newOpen && unreadCount > 0) {
      fetch('/api/notifications/mark-all-read', { method: 'POST' })
        .then(() => setUnreadCount(0))
        .catch(console.error)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetch('/api/notifications/mark-all-read', { method: 'POST' })
                  .then(() => setUnreadCount(0))
                  .catch(console.error)
              }}
            >
              Отметить все прочитанными
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          <NotificationsList onRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
'''

if __name__ == '__main__':
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    if file_path == 'theme-toggle.tsx':
        print(theme_toggle_content)
    elif file_path == 'notifications-bell.tsx':
        print(notifications_bell_content)
    else:
        print("Usage: python3 upload_components.py [theme-toggle.tsx|notifications-bell.tsx]")

