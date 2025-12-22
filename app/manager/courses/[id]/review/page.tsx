"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, Clock, Volume2, Video, FileText, 
  Save, User, Mail, BookOpen
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

interface StudentAnswer {
  progress_id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  lesson_title: string
  block_title: string
  block_type: string
  block_content: any
  answers: any
  score: number | null
  completed_at: string | null
  updated_at: string
}

export default function ReviewAnswersPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [answers, setAnswers] = useState<StudentAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<Record<number, boolean>>({})
  const [grades, setGrades] = useState<Record<number, { score: number; feedback: string }>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<StudentAnswer | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard')
      return
    }

    loadAnswers()
  }, [user, authLoading, params.id])

  async function loadAnswers() {
    try {
      const courseId = params.id
      if (!courseId) return

      const response = await fetch(`/api/manager/courses/${courseId}/answers`)
      if (!response.ok) {
        throw new Error('Ошибка загрузки ответов')
      }

      const data = await response.json()
      if (data.success) {
        setAnswers(data.answers || [])
        
        // Инициализируем grades с текущими оценками
        const initialGrades: Record<number, { score: number; feedback: string }> = {}
        data.answers.forEach((answer: StudentAnswer) => {
          initialGrades[answer.progress_id] = {
            score: answer.score || 0,
            feedback: typeof answer.answers === 'object' && answer.answers?.feedback 
              ? String(answer.answers.feedback)
              : ''
          }
        })
        setGrades(initialGrades)
      }
    } catch (error: any) {
      console.error('Error loading answers:', error)
      toast.error('Ошибка загрузки ответов: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setLoading(false)
    }
  }

  async function saveGrade(progressId: number) {
    if (!grades[progressId]) return
    
    const grade = grades[progressId]
    if (grade.score < 0 || grade.score > 100) {
      toast.error('Оценка должна быть от 0 до 100')
      return
    }

    setGrading(prev => ({ ...prev, [progressId]: true }))

    try {
      const csrfToken = await fetch('/api/csrf-token').then(r => r.json()).then(d => d.token).catch(() => '')

      const response = await fetch(`/api/manager/progress/${progressId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          score: grade.score,
          feedback: grade.feedback || '',
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Оценка сохранена')
        // Обновляем локальное состояние
        setAnswers(prev => prev.map(a => 
          a.progress_id === progressId
            ? { ...a, score: grade.score, answers: { ...a.answers, feedback: grade.feedback } }
            : a
        ))
      } else {
        throw new Error(data.error || 'Ошибка сохранения оценки')
      }
    } catch (error: any) {
      console.error('Error saving grade:', error)
      toast.error('Ошибка сохранения оценки: ' + (error.message || 'Неизвестная ошибка'))
    } finally {
      setGrading(prev => ({ ...prev, [progressId]: false }))
    }
  }

  function getAnswerContent(answer: StudentAnswer, blockId: string | number) {
    const answerValue = answer.answers?.[blockId]
    if (!answerValue) return null

    const questionType = answer.block_content?.questionType

    if (questionType === 'text') {
      return (
        <div className="space-y-2">
          <Label>Текстовый ответ:</Label>
          <div className="p-4 bg-muted rounded-md">
            <p className="whitespace-pre-wrap">{String(answerValue)}</p>
          </div>
        </div>
      )
    }

    if (questionType === 'audio') {
      const audioUrl = String(answerValue).startsWith('/') || String(answerValue).startsWith('http')
        ? String(answerValue)
        : `/api/files/${answerValue}`
      
      return (
        <div className="space-y-2">
          <Label>Аудио ответ:</Label>
          <div className="p-4 bg-muted rounded-md">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        </div>
      )
    }

    if (questionType === 'video') {
      const videoUrl = String(answerValue).startsWith('/') || String(answerValue).startsWith('http')
        ? String(answerValue)
        : `/api/files/${answerValue}`
      
      return (
        <div className="space-y-2">
          <Label>Видео ответ:</Label>
          <div className="p-4 bg-muted rounded-md">
            <video src={videoUrl} controls className="w-full rounded-md" />
          </div>
        </div>
      )
    }

    return null
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return null
  }

  const groupedAnswers = answers.reduce((acc, answer) => {
    const key = `${answer.user_id}-${answer.block_id}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(answer)
    return acc
  }, {} as Record<string, StudentAnswer[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/manager/dashboard`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Проверка ответов студентов</h1>
                <p className="text-sm text-muted-foreground">Курс #{params.id}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {answers.length === 0 ? (
          <Card className="gradient-card border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Нет ответов для проверки</p>
              <p className="text-sm text-muted-foreground mt-2">
                Студенты еще не ответили на вопросы с типом "текст", "аудио" или "видео"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedAnswers).map((answerGroup, idx) => {
              const firstAnswer = answerGroup[0]
              const blockId = firstAnswer.block_id
              const questionType = firstAnswer.block_content?.questionType

              if (!['text', 'audio', 'video'].includes(questionType)) {
                return null
              }

              return (
                <Card key={idx} className="gradient-card border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {firstAnswer.first_name} {firstAnswer.last_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4" />
                          {firstAnswer.email}
                        </CardDescription>
                      </div>
                      <Badge variant={firstAnswer.score !== null ? "default" : "secondary"}>
                        {firstAnswer.score !== null ? `Оценка: ${firstAnswer.score}` : 'Не оценено'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{firstAnswer.lesson_title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{firstAnswer.block_title}</span>
                      </div>
                      {firstAnswer.completed_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Сдано: {new Date(firstAnswer.completed_at).toLocaleString('ru-RU')}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold mb-2 block">Вопрос:</Label>
                      <p className="text-muted-foreground mb-4">{firstAnswer.block_content?.question || 'Без текста вопроса'}</p>
                    </div>

                    {getAnswerContent(firstAnswer, blockId)}

                    <div className="border-t pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`score-${firstAnswer.progress_id}`}>Оценка (0-100):</Label>
                        <Input
                          id={`score-${firstAnswer.progress_id}`}
                          type="number"
                          min="0"
                          max="100"
                          value={grades[firstAnswer.progress_id]?.score ?? 0}
                          onChange={(e) => {
                            const score = parseInt(e.target.value) || 0
                            setGrades(prev => ({
                              ...prev,
                              [firstAnswer.progress_id]: {
                                score,
                                feedback: prev[firstAnswer.progress_id]?.feedback || '',
                              }
                            }))
                          }}
                          className="max-w-32"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`feedback-${firstAnswer.progress_id}`}>Комментарий (опционально):</Label>
                        <Textarea
                          id={`feedback-${firstAnswer.progress_id}`}
                          value={grades[firstAnswer.progress_id]?.feedback || ''}
                          onChange={(e) => {
                            setGrades(prev => ({
                              ...prev,
                              [firstAnswer.progress_id]: {
                                score: prev[firstAnswer.progress_id]?.score || 0,
                                feedback: e.target.value,
                              }
                            }))
                          }}
                          placeholder="Введите комментарий к ответу..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <Button
                        onClick={() => saveGrade(firstAnswer.progress_id)}
                        disabled={grading[firstAnswer.progress_id]}
                        className="gradient-primary text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {grading[firstAnswer.progress_id] ? 'Сохранение...' : 'Сохранить оценку'}
                      </Button>

                      {typeof firstAnswer.answers === 'object' && firstAnswer.answers?.feedback && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <Label className="text-sm font-semibold">Предыдущий комментарий:</Label>
                          <p className="text-sm text-muted-foreground mt-1">{firstAnswer.answers.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

