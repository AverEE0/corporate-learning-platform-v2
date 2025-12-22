"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Pin, 
  Lock, 
  Send, 
  Plus,
  Clock,
  User
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Discussion {
  id: number
  course_id: number
  user_id: number
  title: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  views_count: number
  replies_count: number
  last_reply_at: string | null
  created_at: string
  first_name: string
  last_name: string
  likes_count: number
}

interface DiscussionsListProps {
  courseId: number
}

export function DiscussionsList({ courseId }: DiscussionsListProps) {
  const { user } = useAuth()
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'recent' | 'popular' | 'pinned'>('recent')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadDiscussions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, sort])

  const loadDiscussions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}/discussions?sort=${sort}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDiscussions(data.discussions || [])
        }
      }
    } catch (error) {
      console.error('Error loading discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Заполните все поля')
      return
    }

    try {
      setCreating(true)
      const response = await fetch(`/api/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Обсуждение создано')
          setNewTitle('')
          setNewContent('')
          setShowCreateDialog(false)
          loadDiscussions()
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Ошибка создания обсуждения')
      }
    } catch (error) {
      console.error('Error creating discussion:', error)
      toast.error('Ошибка создания обсуждения')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleLike = async (discussionId: number) => {
    try {
      const response = await fetch(`/api/discussions/${discussionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        loadDiscussions()
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Обсуждения
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Задавайте вопросы и делитесь мнениями
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={sort === 'recent' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSort('recent')}
            >
              Новые
            </Button>
            <Button
              variant={sort === 'popular' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSort('popular')}
            >
              Популярные
            </Button>
            <Button
              variant={sort === 'pinned' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSort('pinned')}
            >
              Закрепленные
            </Button>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Новое обсуждение
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новое обсуждение</DialogTitle>
                <DialogDescription>
                  Задайте вопрос или поделитесь мыслями с другими студентами
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Заголовок</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Краткий заголовок обсуждения"
                    maxLength={255}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Содержимое</Label>
                  <Textarea
                    id="content"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Подробное описание..."
                    rows={6}
                  />
                </div>
                <Button
                  onClick={handleCreateDiscussion}
                  disabled={creating || !newTitle.trim() || !newContent.trim()}
                  className="w-full"
                >
                  {creating ? 'Создание...' : 'Создать обсуждение'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {discussions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Пока нет обсуждений</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать первое обсуждение
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              onLike={() => handleToggleLike(discussion.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface DiscussionCardProps {
  discussion: Discussion
  onLike: () => void
}

function DiscussionCard({ discussion, onLike }: DiscussionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const loadReplies = async () => {
    if (expanded && replies.length > 0) return

    try {
      setLoadingReplies(true)
      const response = await fetch(`/api/discussions/${discussion.id}/replies`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReplies(data.replies || [])
        }
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    } finally {
      setLoadingReplies(false)
    }
  }

  useEffect(() => {
    if (expanded) {
      loadReplies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      return
    }

    try {
      setSendingReply(true)
      const response = await fetch(`/api/discussions/${discussion.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReplyContent('')
          loadReplies()
          onLike() // Обновить список для обновления счетчика
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <Card className={discussion.is_pinned ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {discussion.is_pinned && (
                <Pin className="h-4 w-4 text-primary" />
              )}
              {discussion.is_locked && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">{discussion.title}</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{discussion.first_name} {discussion.last_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(discussion.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 whitespace-pre-wrap">
          {discussion.content}
        </CardDescription>

        <div className="flex items-center gap-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            {discussion.likes_count || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            {discussion.replies_count || 0} ответов
          </Button>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" />
            {discussion.views_count || 0}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {loadingReplies ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="p-3 bg-muted rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {reply.first_name} {reply.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  </div>
                ))}

                <div className="space-y-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Напишите ответ..."
                    rows={3}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyContent.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Отправить
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

