#!/bin/bash
cd /root/corporate-learning-platform-v2

cat > components/notifications/notifications-bell.tsx << 'ENDOFFILE'
"use client"

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
import { useAuth } from "@/lib/auth-context"

export function NotificationsBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    let mounted = true
    let intervalId: NodeJS.Timeout | null = null

    const fetchUnreadCount = async () => {
      if (!mounted) return
      try {
        const response = await fetch('/api/notifications/unread-count', {
          credentials: 'include'
        })
        if (!mounted) return
        if (response.ok) {
          const data = await response.json()
          if (data.success && mounted) {
            setUnreadCount(data.count || 0)
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    fetchUnreadCount()
    intervalId = setInterval(fetchUnreadCount, 30000)

    return () => {
      mounted = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [user?.id])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && unreadCount > 0) {
      fetch('/api/notifications/mark-all-read', { 
        method: 'POST',
        credentials: 'include'
      })
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
                fetch('/api/notifications/mark-all-read', { 
                  method: 'POST',
                  credentials: 'include'
                })
                  .then(() => setUnreadCount(0))
                  .catch(console.error)
              }}
            >
              Отметить все прочитанными
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          <div className="p-8 text-center text-muted-foreground">
            <p>Уведомления загружаются...</p>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
ENDOFFILE

echo "File uploaded"

