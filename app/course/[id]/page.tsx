"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, ArrowRight, Play, Volume2, FileText, 
  HelpCircle, CheckCircle, Clock, BookOpen, ListOrdered, FileUp, MessageSquare, Image as ImageIcon
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { MediaRecorder } from "@/components/media-recorder"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { SequenceOrderBlock } from "@/components/course/sequence-order-block"
import { FileUploadBlock } from "@/components/course/file-upload-block"
import { ContentProtection } from "@/components/content-protection"
import { CourseSidebar } from "@/components/course-sidebar"
import { VideoPlayerEnhanced } from "@/components/video-player-enhanced"

interface Course {
  id: number
  title: string
  description: string
  lessons: Lesson[]
}

interface Lesson {
  id: number
  title: string
  description: string
  blocks: Block[]
}

interface Block {
  id: number
  type: "text" | "video" | "audio" | "image" | "quiz" | "sequence" | "file-upload"
  title: string
  content: any
}

export default function CoursePlayerPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [timeSpent, setTimeSpent] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [recordedAnswers, setRecordedAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      loadCourse(parseInt(params.id as string))
    }
  }, [params.id])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadCourse(courseId: number) {
    try {
      if (!courseId || isNaN(courseId)) {
        throw new Error('Неверный ID курса')
      }

      const response = await fetch(`/api/courses/${courseId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Курс не найден")
          router.push('/dashboard')
          return
        }
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки курса')
      }

      if (!data.course) {
        throw new Error('Данные курса не получены')
      }

      setCourse(data.course)
      
      // Загружаем сохраненный прогресс
      try {
        const progressResponse = await fetch(`/api/progress?courseId=${courseId}`)
        const progressData = await progressResponse.json()
        
        if (progressData.success && progressData.progress) {
          // Восстанавливаем сохраненные ответы
          const savedAnswers = progressData.progress.answers || {}
          if (savedAnswers && typeof savedAnswers === 'object') {
            setAnswers(savedAnswers)
            // Восстанавливаем URL для медиа ответов
            const mediaAnswers: Record<string, string> = {}
            Object.keys(savedAnswers).forEach(key => {
              const value = savedAnswers[key]
              if (typeof value === 'string' && (value.startsWith('/api/files/') || value.startsWith('http') || value.includes('blob:'))) {
                mediaAnswers[key] = value
              }
            })
            setRecordedAnswers(mediaAnswers)
          }
        }
      } catch (progressError) {
        console.error('Error loading progress:', progressError)
        // Не прерываем загрузку курса, если прогресс не загрузился
      }
    } catch (error: any) {
      console.error('Error loading course:', error)
      toast.error(error?.message || "Ошибка загрузки курса")
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Вычисляем напрямую без useMemo, чтобы избежать рекурсии
  const currentLesson = course?.lessons?.[currentLessonIndex]
  const currentBlock = currentLesson?.blocks?.[currentBlockIndex]

  // Вычисляем напрямую без useMemo
  const totalBlocks = course?.lessons?.reduce((sum, l) => {
    if (!l || !Array.isArray(l.blocks)) return sum
    return sum + l.blocks.length
  }, 0) || 0

  const completedBlocks = Math.floor((progress / 100) * totalBlocks)

  const checkAnswerCorrect = (block: Block): boolean => {
    if (!block || block.type !== "quiz" || !block.content) return true

    const userAnswer = answers[block.id]
    if (!userAnswer) return false

    const questionType = block.content.questionType
    const answersList = block.content.answers

    // Защита от циклических ссылок и некорректных данных
    if (!Array.isArray(answersList) || answersList.length === 0) {
      return false
    }

    // Ограничиваем глубину проверки для безопасности
    const maxAnswers = 100
    const safeAnswersList = answersList.slice(0, maxAnswers)

    if (questionType === "single") {
      // Используем findIndex вместо find для большей безопасности
      const correctAnswerIndex = safeAnswersList.findIndex((a: any) => a && a.isCorrect === true)
      if (correctAnswerIndex === -1) return false
      const correctAnswer = safeAnswersList[correctAnswerIndex]
      return correctAnswer?.id === userAnswer
    }

    if (questionType === "multiple") {
      const correctAnswers = safeAnswersList
        .filter((a: any) => a && a.isCorrect === true)
        .map((a: any) => a.id)
        .filter((id: any) => id !== undefined && id !== null)
      
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      return correctAnswers.length === userAnswers.length && 
             correctAnswers.every((id: string) => userAnswers.includes(id))
    }

    // Для текстовых, аудио, видео ответов всегда считаем правильными (проверяет менеджер)
    return true
  }

  const handleBranching = (isCorrect: boolean) => {
    if (!currentBlock || !currentLesson || !course) return

    const branching = currentBlock.content?.branching
    if (!branching) {
      handleNext()
      return
    }

    const path = isCorrect ? branching.correctPath : branching.incorrectPath

    switch (path) {
      case "skip":
        // Пропускаем следующий блок
        if (currentBlockIndex + 2 < currentLesson.blocks.length) {
          setCurrentBlockIndex(currentBlockIndex + 2)
        } else if (currentLessonIndex + 1 < course.lessons.length) {
          setCurrentLessonIndex(currentLessonIndex + 1)
          setCurrentBlockIndex(0)
        } else {
          handleComplete()
        }
        break

      case "repeat":
        // Остаемся на текущем блоке
        toast.error("Неправильный ответ. Попробуйте еще раз.")
        break

      case "hint":
        // Показываем подсказку (можно добавить модальное окно)
        toast.info("Используйте подсказку и попробуйте еще раз")
        break

      case "specific":
        // Переход к конкретному блоку
        const targetBlockId = branching.targetBlockId
        if (targetBlockId) {
          // Находим блок по ID
          for (let i = 0; i < course.lessons.length; i++) {
            const blockIndex = course.lessons[i].blocks.findIndex((b: any) => 
              b.id.toString() === targetBlockId || b.title === targetBlockId
            )
            if (blockIndex !== -1) {
              setCurrentLessonIndex(i)
              setCurrentBlockIndex(blockIndex)
              return
            }
          }
        }
        handleNext()
        break

      default:
        handleNext()
    }
  }

  const handleNext = () => {
    if (!currentLesson) return

    // Проверяем ветвление для тестов
    if (currentBlock?.type === "quiz" && currentBlock.content?.branching) {
      const isCorrect = checkAnswerCorrect(currentBlock)
      handleBranching(isCorrect)
      return
    }

    if (currentBlockIndex < currentLesson.blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1)
    } else if (currentLessonIndex < (course?.lessons.length || 0) - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
      setCurrentBlockIndex(0)
    } else {
      // Курс завершен
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1)
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
      const prevLesson = course?.lessons[currentLessonIndex - 1]
      setCurrentBlockIndex(prevLesson?.blocks.length ? prevLesson.blocks.length - 1 : 0)
    }
  }

  const handleComplete = async () => {
    if (!course || !user) return

    try {
      // Сначала сохраняем все ответы
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          completionPercentage: 100,
          score: 0,
          timeSpent,
          completed: true,
          answers: answers, // Исправлено: отправляем реальные ответы вместо пустого объекта
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка сохранения прогресса')
      }

      toast.success("Курс завершен!")
      
      // Небольшая задержка перед редиректом, чтобы пользователь увидел сообщение
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Error completing course:', error)
      toast.error(error.message || "Ошибка сохранения прогресса")
    }
  }

  // Используем useRef для хранения последних значений, чтобы избежать рекурсии
  const answersRef = useRef(answers)
  const courseRef = useRef(course)
  
  useEffect(() => {
    answersRef.current = answers
    courseRef.current = course
  }, [answers, course])

  // Используем useCallback для стабильной ссылки на функцию
  const saveProgress = useCallback(async () => {
    const currentCourse = courseRef.current
    const currentAnswers = answersRef.current
    
    if (!currentCourse || !user) return

    // Получаем данные напрямую из course, а не из мемоизированных значений
    const lessons = currentCourse.lessons || []
    if (currentLessonIndex >= lessons.length) return
    
    const lesson = lessons[currentLessonIndex]
    if (!lesson || !Array.isArray(lesson.blocks)) return
    
    const blocks = lesson.blocks
    const blocksCount = blocks.length || 1

    const completionPercentage = Math.round(
      ((currentLessonIndex * 100 + (currentBlockIndex + 1) * (100 / blocksCount)) / 
      (lessons.length * 100)) * 100
    )

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: currentCourse.id,
          lessonId: lesson.id,
          blockId: blocks[currentBlockIndex]?.id,
          completionPercentage,
          timeSpent,
          completed: false,
          answers: currentAnswers,
        }),
      })

      // Обновляем прогресс только если он действительно изменился (более чем на 1%)
      setProgress((prev) => {
        if (Math.abs(prev - completionPercentage) < 1) {
          return prev // Не обновляем, если изменение меньше 1%
        }
        return completionPercentage
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }, [currentLessonIndex, currentBlockIndex, timeSpent, user?.id]) // Только примитивные зависимости

  const saveAnswer = async (blockId: string | number, answer: any) => {
    if (!course || !user) return
    const newAnswers = { ...answers, [blockId]: answer }
    
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: currentLesson?.id,
          blockId: blockId,
          answers: newAnswers,
        }),
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  // Используем useRef для отслеживания последнего сохранения, чтобы избежать рекурсии
  const lastSaveRef = useRef<{ lessonIndex: number; blockIndex: number } | null>(null)
  const saveInProgressRef = useRef(false)

  useEffect(() => {
    // Используем currentBlockIndex и currentLessonIndex для проверки, а не сам currentBlock
    if (!course || !Array.isArray(course.lessons) || currentLessonIndex >= course.lessons.length) return
    
    const lesson = course.lessons[currentLessonIndex]
    if (!lesson || !Array.isArray(lesson.blocks) || currentBlockIndex >= lesson.blocks.length) return

    // Проверяем, не сохраняли ли мы уже для этого блока
    const lastSave = lastSaveRef.current
    if (lastSave && lastSave.lessonIndex === currentLessonIndex && lastSave.blockIndex === currentBlockIndex) {
      // Уже сохраняли для этого блока, пропускаем
    } else {
      // Используем setTimeout для отложенного сохранения, чтобы избежать рекурсии
      if (!saveInProgressRef.current) {
        saveInProgressRef.current = true
        const saveTimeout = setTimeout(() => {
          if (saveProgress) {
            saveProgress().finally(() => {
              saveInProgressRef.current = false
              lastSaveRef.current = { lessonIndex: currentLessonIndex, blockIndex: currentBlockIndex }
            })
          } else {
            saveInProgressRef.current = false
          }
        }, 500) // Увеличиваем задержку до 500ms
        
        // Получаем тип блока напрямую из данных, чтобы избежать пересчета
        const block = lesson.blocks[currentBlockIndex]
        
        // Устанавливаем таймер для ограничения времени на ответ
        if (block?.type === "quiz" && block.content?.timeLimit) {
          const limit = block.content.timeLimit
          setTimeLeft(limit)
          
          const timer = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer)
                toast.error("Время истекло!")
                handleNext()
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => {
            clearTimeout(saveTimeout)
            clearInterval(timer)
          }
        } else {
          setTimeLeft(null)
        }
        
        return () => clearTimeout(saveTimeout)
      }
    }
    
    // Получаем тип блока напрямую из данных, чтобы избежать пересчета
    const block = lesson.blocks[currentBlockIndex]
    
    // Устанавливаем таймер для ограничения времени на ответ
    if (block?.type === "quiz" && block.content?.timeLimit) {
      const limit = block.content.timeLimit
      setTimeLeft(limit)
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            toast.error("Время истекло!")
            handleNext()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(timer)
      }
    } else {
      setTimeLeft(null)
    }
  }, [currentBlockIndex, currentLessonIndex, course?.id, saveProgress]) // Добавляем saveProgress в зависимости

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка курса...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Курс не найден</p>
            <Link href="/dashboard">
              <Button>Вернуться к курсам</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Защита от копирования только для студентов
  const isStudent = user?.role === 'student'
  
  return (
    <ContentProtection enabled={isStudent}>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-bold truncate">{course.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {currentLesson?.title} • Блок {currentBlockIndex + 1} из {currentLesson?.blocks.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Прогресс: {Math.round(progress)}%
              </div>
              <div className="w-24 md:w-32">
                <Progress value={progress} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar с содержанием */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24">
              <CourseSidebar
                lessons={course.lessons || []}
                currentLessonIndex={currentLessonIndex}
                currentBlockIndex={currentBlockIndex}
                onNavigate={(lessonIndex, blockIndex) => {
                  setCurrentLessonIndex(lessonIndex)
                  setCurrentBlockIndex(blockIndex)
                }}
                progress={{}}
              />
            </div>
          </div>

          {/* Основной контент */}
          <div className="lg:col-span-3 max-w-4xl">
        {/* Lesson Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">{currentLesson?.title}</span>
            <Badge variant="secondary">
              Урок {currentLessonIndex + 1} из {course.lessons.length}
            </Badge>
          </div>
          {currentLesson?.description && (
            <p className="text-sm text-muted-foreground">{currentLesson.description}</p>
          )}
        </div>

        {/* Block Content */}
        {currentBlock && (
          <motion.div
            key={currentBlock.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="gradient-card border-0 shadow-lg mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {currentBlock.type === "text" && <FileText className="h-5 w-5" />}
                  {currentBlock.type === "video" && <Play className="h-5 w-5" />}
                  {currentBlock.type === "audio" && <Volume2 className="h-5 w-5" />}
                  {currentBlock.type === "image" && <ImageIcon className="h-5 w-5" />}
                  {currentBlock.type === "quiz" && <HelpCircle className="h-5 w-5" />}
                  {currentBlock.type === "sequence" && <ListOrdered className="h-5 w-5" />}
                  {currentBlock.type === "file-upload" && <FileUp className="h-5 w-5" />}
                  <CardTitle>{currentBlock.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href={`/course/${course.id}/discussions`}>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Обсуждения
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentBlock.type === "text" && (() => {
                  // Получаем HTML контент из редактора
                  let htmlContent = currentBlock.content?.text || ""
                  
                  console.log('Текстовый блок, исходный контент:', htmlContent?.substring(0, 200))
                  console.log('Тип контента:', typeof htmlContent)
                  
                  if (!htmlContent) {
                    return <p className="text-muted-foreground">Нет содержимого</p>
                  }
                  
                  // Убеждаемся, что это строка
                  if (typeof htmlContent !== 'string') {
                    htmlContent = String(htmlContent)
                  }
                  
                  // Разэкранируем HTML если он был экранирован
                  // ВАЖНО: сначала заменяем двойные экранирования, затем одинарные
                  // Обрабатываем в правильном порядке, чтобы не сломать другие сущности
                  htmlContent = htmlContent
                    // Сначала обрабатываем двойные экранирования
                    .replace(/&amp;lt;/g, '<')
                    .replace(/&amp;gt;/g, '>')
                    .replace(/&amp;quot;/g, '"')
                    .replace(/&amp;#39;/g, "'")
                    .replace(/&amp;#x27;/g, "'")
                    .replace(/&amp;#x2F;/g, '/')
                    // Затем обрабатываем одинарные экранирования
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&#x27;/g, "'")
                    .replace(/&#x2F;/g, '/')
                    // В последнюю очередь заменяем оставшиеся &amp;
                    .replace(/&amp;/g, '&')
                  
                  // Обрабатываем изображения: если путь относительный, добавляем /api/files/
                  htmlContent = htmlContent.replace(
                    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
                    (match: string, before: string, src: string, after: string) => {
                      console.log('Обработка изображения, src:', src?.substring(0, 100))
                      // Если это не полный URL (http/https) и не начинается с /api/files/, добавляем /api/files/
                      if (!src.startsWith('http') && !src.startsWith('/api/files/') && !src.startsWith('data:') && !src.startsWith('//')) {
                        // Проверяем, не начинается ли путь с /, если нет - добавляем /api/files/
                        const newSrc = src.startsWith('/') ? `/api/files${src}` : `/api/files/${src}`
                        return `<img${before}src="${newSrc}"${after} style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;">`
                      }
                      return `<img${before}src="${src}"${after} style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;">`
                    }
                  )
                  
                  // Обрабатываем видео: если путь относительный, добавляем /api/files/
                  htmlContent = htmlContent.replace(
                    /<video([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
                    (match: string, before: string, src: string, after: string) => {
                      console.log('Обработка видео, src:', src?.substring(0, 100))
                      // Если это не полный URL (http/https) и не начинается с /api/files/, добавляем /api/files/
                      if (!src.startsWith('http') && !src.startsWith('/api/files/') && !src.startsWith('data:') && !src.startsWith('//')) {
                        const newSrc = src.startsWith('/') ? `/api/files${src}` : `/api/files/${src}`
                        return `<video${before}src="${newSrc}"${after} controls style="max-width: 100%; border-radius: 8px; margin: 16px 0; display: block;"></video>`
                      }
                      return `<video${before}src="${src}"${after} controls style="max-width: 100%; border-radius: 8px; margin: 16px 0; display: block;"></video>`
                    }
                  )
                  
                  // Обрабатываем iframe (для YouTube, Vimeo и т.д.)
                  htmlContent = htmlContent.replace(
                    /<iframe([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
                    (match: string, before: string, src: string, after: string) => {
                      console.log('Обработка iframe, src:', src?.substring(0, 100))
                      // iframe обычно уже содержит полный URL для YouTube/Vimeo
                      // Проверяем, нужно ли добавить атрибуты для правильного отображения
                      const hasAllow = before.includes('allow=') || after.includes('allow=')
                      const hasStyle = before.includes('style=') || after.includes('style=')
                      
                      let iframeAttrs = before + after
                      if (!hasAllow) {
                        iframeAttrs = before + ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen' + after
                      }
                      if (!hasStyle) {
                        iframeAttrs = iframeAttrs.replace(/(allowfullscreen)?$/, ' style="max-width: 100%; width: 100%; aspect-ratio: 16/9; border-radius: 8px; margin: 16px 0; display: block;" allowfullscreen')
                      }
                      
                      return `<iframe${iframeAttrs}src="${src}"></iframe>`
                    }
                  )
                  
                  console.log('Обработанный HTML:', htmlContent?.substring(0, 200))
                  
                  return (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      style={{
                        // Убеждаемся, что видео и iframe отображаются правильно
                        '--tw-prose-video': 'inherit',
                      } as React.CSSProperties}
                    />
                  )
                })()}

                {currentBlock.type === "video" && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {currentBlock.content?.url ? (() => {
                      const url = currentBlock.content.url
                      // Проверяем, является ли это внешней ссылкой на видео платформу
                      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
                      const isRutube = url.includes('rutube.ru')
                      const isVimeo = url.includes('vimeo.com')
                      
                      if (isYouTube || isRutube || isVimeo) {
                        // Конвертируем ссылки в embed формат
                        let embedUrl = url
                        if (url.includes('youtube.com/watch?v=')) {
                          embedUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/').split('&')[0]
                        } else if (url.includes('youtu.be/')) {
                          embedUrl = url.replace('youtu.be/', 'youtube.com/embed/')
                        } else if (url.includes('rutube.ru/video/')) {
                          const videoIdMatch = url.match(/rutube\.ru\/video\/([^\/\?]+)/)
                          if (videoIdMatch && videoIdMatch[1]) {
                            embedUrl = `https://rutube.ru/play/embed/${videoIdMatch[1]}`
                          }
                        } else if (url.includes('vimeo.com/')) {
                          const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
                          if (videoId) {
                            embedUrl = `https://player.vimeo.com/video/${videoId}`
                          }
                        }
                        
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={currentBlock.title || "Видео"}
                          />
                        )
                      }
                      
                      // Для локальных файлов используем улучшенный видео плеер
                      const videoUrl = url.startsWith('/') || url.startsWith('http') 
                        ? url 
                        : `/api/files/${url}`
                      
                      return (
                        <VideoPlayerEnhanced
                          src={videoUrl}
                          title={currentBlock.title}
                          autoPlay={false}
                          loop={false}
                          controls={true}
                          className="w-full h-full"
                          key={`video-${currentBlock.id}-${currentBlockIndex}`} // Добавляем key для пересоздания компонента при смене блока
                        />
                      )
                    })() : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Видео не загружено</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentBlock.type === "audio" && (
                  <div className="bg-muted rounded-lg p-6">
                    {currentBlock.content?.url ? (
                      <audio
                        src={currentBlock.content.url.startsWith('/') || currentBlock.content.url.startsWith('http')
                          ? currentBlock.content.url
                          : `/api/files/${currentBlock.content.url}`}
                        controls
                        className="w-full"
                      >
                        Ваш браузер не поддерживает аудио.
                      </audio>
                    ) : (
                      <div className="text-center">
                        <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Аудио не загружено</p>
                      </div>
                    )}
                  </div>
                )}

                {currentBlock.type === "image" && (
                  <div className="space-y-4">
                    {currentBlock.content?.url ? (
                      <div className="bg-muted rounded-lg p-4">
                        <img 
                          src={currentBlock.content.url.startsWith('/') || currentBlock.content.url.startsWith('http')
                            ? currentBlock.content.url
                            : `/api/files/${currentBlock.content.url}`} 
                          alt={currentBlock.content?.caption || currentBlock.title || "Изображение"}
                          className="max-w-full h-auto rounded-md mx-auto"
                          style={{ maxHeight: '600px' }}
                        />
                        {currentBlock.content?.caption && (
                          <p className="text-sm text-muted-foreground text-center mt-4 italic">
                            {currentBlock.content.caption}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted rounded-lg">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Изображение не загружено</p>
                      </div>
                    )}
                  </div>
                )}

                {currentBlock.type === "quiz" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium">{currentBlock.content?.question || "Вопрос теста"}</p>
                      <div className="flex items-center gap-2">
                        {currentBlock.content?.points && (
                          <Badge variant="outline">
                            {currentBlock.content.points} балл{currentBlock.content.points > 1 ? "ов" : ""}
                          </Badge>
                        )}
                        {timeLeft !== null && timeLeft > 0 && (
                          <Badge variant={timeLeft < 10 ? "destructive" : "default"}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {currentBlock.content?.questionType === "single" && (
                      <RadioGroup
                        value={answers[currentBlock.id]?.toString() || ""}
                        onValueChange={(value) => {
                          setAnswers({ ...answers, [currentBlock.id]: value })
                          saveAnswer(currentBlock.id, value)
                        }}
                      >
                        {currentBlock.content?.answers?.map((answer: any) => (
                          <div key={answer.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                            <RadioGroupItem value={answer.id} id={answer.id} />
                            <label htmlFor={answer.id} className="flex-1 cursor-pointer">
                              {answer.text}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {currentBlock.content?.questionType === "multiple" && (
                      <div className="space-y-2">
                        {currentBlock.content?.answers?.map((answer: any) => (
                          <div key={answer.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                            <Checkbox
                              id={answer.id}
                              checked={(answers[currentBlock.id] || []).includes(answer.id)}
                              onCheckedChange={(checked) => {
                                const currentAnswers = answers[currentBlock.id] || []
                                const newAnswers = checked
                                  ? [...currentAnswers, answer.id]
                                  : currentAnswers.filter((id: string) => id !== answer.id)
                                setAnswers({ ...answers, [currentBlock.id]: newAnswers })
                                saveAnswer(currentBlock.id, newAnswers)
                              }}
                            />
                            <label htmlFor={answer.id} className="flex-1 cursor-pointer">
                              {answer.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentBlock.content?.questionType === "text" && (
                      <div className="space-y-2">
                        <Textarea
                          value={answers[currentBlock.id] || ""}
                          onChange={(e) => {
                            setAnswers({ ...answers, [currentBlock.id]: e.target.value })
                            saveAnswer(currentBlock.id, e.target.value)
                          }}
                          placeholder="Введите ваш ответ..."
                          className="min-h-[120px]"
                        />
                      </div>
                    )}

                    {currentBlock.content?.questionType === "audio" && (
                      <div className="space-y-4">
                        {recordedAnswers[currentBlock.id] ? (
                          <div className="space-y-2">
                            <audio src={recordedAnswers[currentBlock.id]} controls className="w-full" />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const newRecorded = { ...recordedAnswers }
                                delete newRecorded[currentBlock.id]
                                setRecordedAnswers(newRecorded)
                                setAnswers({ ...answers, [currentBlock.id]: undefined })
                              }}
                            >
                              Записать заново
                            </Button>
                          </div>
                        ) : (
                          <MediaRecorder
                            type="audio"
                            title="Записать аудио ответ"
                            description="Нажмите кнопку для начала записи"
                            onRecordingComplete={async (blob, url) => {
                              // Сохраняем URL (может быть либо blob URL, либо серверный URL)
                              const answerUrl = url.startsWith('blob:') || url.startsWith('/api/files/') 
                                ? url 
                                : `/api/files/${url}`
                              setRecordedAnswers({ ...recordedAnswers, [currentBlock.id]: answerUrl })
                              setAnswers({ ...answers, [currentBlock.id]: url })
                              await saveAnswer(currentBlock.id, url)
                            }}
                          />
                        )}
                      </div>
                    )}

                    {currentBlock.content?.questionType === "video" && (
                      <div className="space-y-4">
                        {recordedAnswers[currentBlock.id] ? (
                          <div className="space-y-2">
                            <video 
                              src={recordedAnswers[currentBlock.id]} 
                              controls 
                              className="w-full rounded-md"
                              onError={(e) => {
                                console.error('Video playback error:', e)
                                toast.error('Ошибка воспроизведения видео. Попробуйте записать заново.')
                              }}
                              onPlay={(e) => {
                                // Игнорируем ошибки прерывания воспроизведения
                                const video = e.currentTarget
                                video.play().catch((error) => {
                                  if (error.name !== 'AbortError') {
                                    console.error('Video play error:', error)
                                  }
                                })
                              }}
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const newRecorded = { ...recordedAnswers }
                                delete newRecorded[currentBlock.id]
                                setRecordedAnswers(newRecorded)
                                setAnswers({ ...answers, [currentBlock.id]: undefined })
                              }}
                            >
                              Записать заново
                            </Button>
                          </div>
                        ) : (
                          <MediaRecorder
                            type="video"
                            title="Записать видео ответ"
                            description="Нажмите кнопку для начала записи"
                            onRecordingComplete={async (blob, url) => {
                              // Сохраняем URL (может быть либо blob URL, либо серверный URL)
                              const answerUrl = url.startsWith('blob:') || url.startsWith('/api/files/') 
                                ? url 
                                : `/api/files/${url}`
                              setRecordedAnswers({ ...recordedAnswers, [currentBlock.id]: answerUrl })
                              setAnswers({ ...answers, [currentBlock.id]: url })
                              await saveAnswer(currentBlock.id, url)
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentBlock.type === "sequence" && (
                      <div className="space-y-4">
                        <p className="text-lg font-medium">{currentBlock.content?.instruction || "Расставьте элементы в правильном порядке"}</p>
                        <SequenceOrderBlock
                          items={currentBlock.content?.items || []}
                          correctOrder={currentBlock.content?.correctOrder || []}
                          onAnswerChange={(order) => {
                            setAnswers({ ...answers, [currentBlock.id]: order })
                            saveAnswer(currentBlock.id, order)
                          }}
                          userAnswer={answers[currentBlock.id]}
                        />
                      </div>
                    )}

                    {currentBlock.type === "file-upload" && (
                      <div className="space-y-4">
                        <p className="text-lg font-medium">{currentBlock.content?.instruction || "Загрузите файл"}</p>
                        <FileUploadBlock
                          allowedTypes={currentBlock.content?.allowedTypes || ["document"]}
                          maxSize={currentBlock.content?.maxSize || 10}
                          onFileUpload={(fileUrl) => {
                            setAnswers({ ...answers, [currentBlock.id]: fileUrl })
                            saveAnswer(currentBlock.id, fileUrl)
                          }}
                          uploadedFile={answers[currentBlock.id]}
                        />
                      </div>
                    )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentLessonIndex === 0 && currentBlockIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>

          <div className="text-sm text-muted-foreground">
            Блок {currentBlockIndex + 1} из {currentLesson?.blocks.length} • 
            Время: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </div>

          <Button
            onClick={handleNext}
            className="gradient-primary text-white"
            disabled={false}
          >
            {currentLessonIndex === (course.lessons.length - 1) &&
            currentBlockIndex === (currentLesson?.blocks.length || 1) - 1
              ? "Завершить курс"
              : "Далее"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
          </div>
        </div>
      </div>
    </div>
    </ContentProtection>
  )
}

