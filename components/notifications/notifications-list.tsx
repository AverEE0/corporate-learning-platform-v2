"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Check } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

interface NotificationsListProps {
  onRead?: () => void
}

export function NotificationsList({ onRead }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.notifications || [])
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        )
        onRead?.()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course_assigned':
        return '📚'
      case 'course_completed':
        return '✅'
      case 'deadline_reminder':
        return '⏰'
      case 'new_message':
        return '💬'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'course_assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'course_completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'deadline_reminder':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Нет уведомлений</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 hover:bg-accent transition-colors ${
            !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getNotificationColor(notification.type)}`}
                >
                  {notification.type === 'course_assigned' && 'Курс назначен'}
                  {notification.type === 'course_completed' && 'Курс завершен'}
                  {notification.type === 'deadline_reminder' && 'Напоминание'}
                  {notification.type === 'new_message' && 'Сообщение'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                <div className="flex items-center gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => markAsRead(notification.id)}
                      title="Отметить прочитанным"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => deleteNotification(notification.id)}
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {notification.link && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-2"
                  onClick={() => window.location.href = notification.link!}
                >
                  Перейти →
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

