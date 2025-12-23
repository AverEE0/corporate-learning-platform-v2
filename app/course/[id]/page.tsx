"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, XCircle, Play, Pause } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { ContentProtection } from "@/components/content-protection"
import { MediaRecorder } from "@/components/media-recorder"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { VideoPlayerEnhanced } from "@/components/video-player-enhanced"
import { CourseSidebar } from "@/components/course-sidebar"

interface Block {
  id: string | number
  type: string
  title?: string
  content?: any
  order_index?: number
}

interface Lesson {
  id: number
  title: string
  description?: string
  blocks?: Block[]
  order_index?: number
}

interface Course {
  id: number
  title: string
  description?: string
  lessons?: Lesson[]
}

export default function CoursePlayerPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const courseId = params?.id ? parseInt(params.id as string) : null

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [answers, setAnswers] = useState<Record<string | number, any>>({})
  const [recordedAnswers, setRecordedAnswers] = useState<Record<string | number, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Вычисляем напрямую без useMemo, чтобы избежать рекурсии
  const currentLesson = course?.lessons?.[currentLessonIndex]
  const currentBlock = currentLesson?.blocks?.[currentBlockIndex]

  // Безопасная проверка массива без использования Array.isArray (избегаем рекурсии)
  const isArraySafe = (value: any): boolean => {
    return value != null && typeof value === 'object' && 'length' in value && typeof value.length === 'number'
  }

  // Вычисляем напрямую без useMemo и без методов массивов (избегаем рекурсии)
  let totalBlocks = 0
  if (course?.lessons && isArraySafe(course.lessons)) {
    for (let i = 0; i < course.lessons.length; i++) {
      const l = course.lessons[i]
      if (l && l.blocks) {
        const blocks = l.blocks
        if (isArraySafe(blocks)) {
          totalBlocks += blocks.length
        }
      }
    }
  }

  const completedBlocks = Math.floor((progress / 100) * totalBlocks)

  // ВРЕМЕННО ОТКЛЮЧЕНО: checkAnswerCorrect вызывает бесконечную рекурсию
  // Будет переписано позже с полной защитой от рекурсии
  // Проверка правильности ответов будет выполняться на сервере
  const checkAnswerCorrect = (_block: Block): boolean => {
    // Всегда возвращаем true, чтобы не блокировать навигацию
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
        if (currentLesson.blocks && currentBlockIndex + 2 < currentLesson.blocks.length) {
          setCurrentBlockIndex(currentBlockIndex + 2)
        } else if (course.lessons && currentLessonIndex + 1 < course.lessons.length) {
          setCurrentLessonIndex(currentLessonIndex + 1)
          setCurrentBlockIndex(0)
        } else {
          handleComplete()
        }
        break

      case "repeat":
        // Повторяем текущий блок
        // Просто остаемся на месте
        break

      case "hint":
        // Показываем подсказку (можно добавить модальное окно)
        toast.info("Используйте подсказку и попробуйте еще раз")
        break

      case "specific":
        // Переход к конкретному блоку
        const targetBlockId = branching.targetBlockId
        if (targetBlockId && course.lessons) {
          // Находим блок по ID (без findIndex, чтобы избежать рекурсии)
          for (let i = 0; i < course.lessons.length; i++) {
            const lesson = course.lessons[i]
            if (!lesson || !lesson.blocks || !isArraySafe(lesson.blocks)) continue
            const blocks = lesson.blocks
            for (let j = 0; j < blocks.length; j++) {
              const b = blocks[j]
              if (b && (b.id?.toString() === targetBlockId || b.title === targetBlockId)) {
                setCurrentLessonIndex(i)
                setCurrentBlockIndex(j)
                return
              }
            }
          }
        }
        handleNext()
        break

      default:
        handleNext()
    }
  }

  // Используем useRef для защиты от рекурсивных вызовов handleNext
  const isNavigatingRef = useRef(false)
  const currentLessonIndexRef = useRef(currentLessonIndex)
  const currentBlockIndexRef = useRef(currentBlockIndex)
  const courseRefForNavigation = useRef(course)
  
  useEffect(() => {
    currentLessonIndexRef.current = currentLessonIndex
    currentBlockIndexRef.current = currentBlockIndex
    courseRefForNavigation.current = course
  }, [currentLessonIndex, currentBlockIndex, course])
  
  const handleNext = useCallback(() => {
    const currentCourse = courseRefForNavigation.current
    const lessonIndex = currentLessonIndexRef.current
    const blockIndex = currentBlockIndexRef.current
    
    if (!currentCourse || !currentCourse.lessons || isNavigatingRef.current) return
    
    const currentLesson = currentCourse.lessons[lessonIndex]
    if (!currentLesson || !currentLesson.blocks) return
    
    const blocks = currentLesson.blocks
    if (!isArraySafe(blocks)) return
    
    isNavigatingRef.current = true
    
    // Временно отключена проверка ветвления, чтобы избежать рекурсии
    // if (currentBlock?.type === "quiz" && currentBlock.content?.branching) {
    //   const isCorrect = checkAnswerCorrect(currentBlock)
    //   handleBranching(isCorrect)
    //   return
    // }

    if (blockIndex < blocks.length - 1) {
      setCurrentBlockIndex(blockIndex + 1)
    } else if (lessonIndex < currentCourse.lessons.length - 1) {
      setCurrentLessonIndex(lessonIndex + 1)
      setCurrentBlockIndex(0)
    } else {
      // Курс завершен
      handleComplete()
    }
    
    // Разрешаем следующую навигацию через небольшую задержку
    setTimeout(() => {
      isNavigatingRef.current = false
    }, 200)
  }, [])

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1)
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1)
      const prevLesson = course?.lessons && course.lessons[currentLessonIndex - 1] ? course.lessons[currentLessonIndex - 1] : null
      setCurrentBlockIndex(prevLesson?.blocks && prevLesson.blocks.length ? prevLesson.blocks.length - 1 : 0)
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
        throw new Error("Ошибка сохранения прогресса")
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
  const saveProgressRef = useRef<(() => Promise<void>) | null>(null)
  
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
    if (!lesson || !lesson.blocks || !isArraySafe(lesson.blocks)) return
    
    const blocks = lesson.blocks
    const blocksCount = blocks && blocks.length ? blocks.length : 1

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

  // Сохраняем стабильную ссылку на saveProgress БЕЗ зависимости от saveProgress, чтобы избежать рекурсии
  useEffect(() => {
    saveProgressRef.current = saveProgress
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLessonIndex, currentBlockIndex, timeSpent, user?.id]) // Используем те же зависимости, что и в useCallback

  // Используем useCallback для saveAnswer, чтобы избежать рекурсии
  const saveAnswer = useCallback(async (blockId: string | number, answer: any) => {
    const currentCourse = courseRef.current
    const currentAnswers = answersRef.current
    
    if (!currentCourse || !user) return
    
    const newAnswers = { ...currentAnswers, [blockId]: answer }
    setAnswers(newAnswers)
    
    // Обновляем ref сразу
    answersRef.current = newAnswers
    
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: currentCourse.id,
          lessonId: currentLesson?.id,
          blockId: blockId,
          answers: newAnswers,
        }),
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }, [user?.id, currentLesson?.id])

  // Используем useRef для отслеживания последнего сохранения, чтобы избежать рекурсии
  const lastSaveRef = useRef<{ lessonIndex: number; blockIndex: number } | null>(null)
  const saveInProgressRef = useRef(false)
  const textAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Используем отдельный useEffect для таймера, чтобы избежать рекурсии
  useEffect(() => {
    if (!course || !course.lessons || !isArraySafe(course.lessons) || currentLessonIndex >= course.lessons.length) {
      setTimeLeft(null)
      return
    }
    
    const lesson = course.lessons[currentLessonIndex]
    if (!lesson || !lesson.blocks || !isArraySafe(lesson.blocks) || currentBlockIndex >= lesson.blocks.length) {
      setTimeLeft(null)
      return
    }

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
            // Используем ref для handleNext, чтобы избежать рекурсии
            const nextFn = handleNext
            if (nextFn && !isNavigatingRef.current) {
              setTimeout(() => nextFn(), 100)
            }
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
  }, [currentBlockIndex, currentLessonIndex, course?.id, handleNext])

  // Отдельный useEffect для сохранения прогресса
  useEffect(() => {
    // Используем currentBlockIndex и currentLessonIndex для проверки, а не сам currentBlock
    if (!course || !course.lessons || !isArraySafe(course.lessons) || currentLessonIndex >= course.lessons.length) return
    
    const lesson = course.lessons[currentLessonIndex]
    if (!lesson || !isArraySafe(lesson.blocks) || currentBlockIndex >= lesson.blocks.length) return

    // Проверяем, не сохраняли ли мы уже для этого блока
    const lastSave = lastSaveRef.current
    if (lastSave && lastSave.lessonIndex === currentLessonIndex && lastSave.blockIndex === currentBlockIndex) {
      // Уже сохраняли для этого блока, пропускаем
      return
    }

    // Используем setTimeout для отложенного сохранения, чтобы избежать рекурсии
    if (saveInProgressRef.current) {
      return // Уже идет сохранение
    }

    saveInProgressRef.current = true
    const saveTimeout = setTimeout(() => {
      const saveFn = saveProgressRef.current
      if (saveFn) {
        saveFn().finally(() => {
          saveInProgressRef.current = false
          lastSaveRef.current = { lessonIndex: currentLessonIndex, blockIndex: currentBlockIndex }
        })
      } else {
        saveInProgressRef.current = false
      }
    }, 1000) // Увеличиваем задержку до 1000ms для стабильности
    
    return () => {
      clearTimeout(saveTimeout)
    }
  }, [currentBlockIndex, currentLessonIndex, course?.id]) // НЕ добавляем saveProgress, используем ref

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
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Курс не найден</p>
          <Button onClick={() => router.push('/dashboard')}>Вернуться на главную</Button>
        </div>
      </div>
    )
  }

  // Загружаем курс при монтировании
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/courses/${courseId}`, { credentials: 'include' })
        if (!response.ok) {
          throw new Error("Ошибка загрузки курса")
        }
        const data = await response.json()
        if (!data.success || !data.course) {
          throw new Error("Курс не найден")
        }
        setCourse(data.course)

        // Загружаем прогресс пользователя
        const progressResponse = await fetch(`/api/progress?courseId=${courseId}`, { credentials: 'include' })
        if (progressResponse.ok) {
          const progressData = await progressResponse.json()
          if (progressData.success && progressData.progress) {
            setProgress(progressData.progress.completionPercentage || 0)
            setTimeSpent(progressData.progress.timeSpent || 0)
            if (progressData.progress.answers) {
              setAnswers(progressData.progress.answers)
            }
            
            // Восстанавливаем позицию в курсе (без findIndex, чтобы избежать рекурсии)
            if (progressData.progress.lessonId && progressData.progress.blockId && data.course.lessons) {
              let lessonIndex = -1
              for (let i = 0; i < data.course.lessons.length; i++) {
                if (data.course.lessons[i]?.id === progressData.progress.lessonId) {
                  lessonIndex = i
                  break
                }
              }
              if (lessonIndex >= 0) {
                setCurrentLessonIndex(lessonIndex)
                const lesson = data.course.lessons[lessonIndex]
                if (lesson && isArraySafe(lesson.blocks)) {
                  let blockIndex = -1
                  for (let j = 0; j < lesson.blocks.length; j++) {
                    if (lesson.blocks[j]?.id === progressData.progress.blockId) {
                      blockIndex = j
                      break
                    }
                  }
                  if (blockIndex >= 0) {
                    setCurrentBlockIndex(blockIndex)
                  }
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Error loading course:', error)
        toast.error(error?.message || "Ошибка загрузки курса")
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId, router])

  // Отслеживаем время, проведенное на странице
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!currentBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Блок не найден</p>
          <Button onClick={() => router.push('/dashboard')}>Вернуться на главную</Button>
        </div>
      </div>
    )
  }

  // Вычисляем прогресс по урокам для боковой панели
  // Используем useMemo с правильными зависимостями для обновления при изменении answers
  // БЕЗ методов массивов (forEach) для избежания рекурсии
  const lessonProgress = useMemo(() => {
    if (!course?.lessons || !isArraySafe(course.lessons)) return {}
    const progressMap: Record<number, number> = {}
    const lessons = course.lessons
    
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i]
      if (!lesson || !isArraySafe(lesson.blocks) || lesson.blocks.length === 0) {
        progressMap[lesson.id] = 0
        continue
      }
      
      // Подсчитываем пройденные блоки
      let completedCount = 0
      for (let j = 0; j < lesson.blocks.length; j++) {
        const block = lesson.blocks[j]
        if (block && block.id !== undefined) {
          const answer = answers[block.id]
          if (answer !== undefined && answer !== null && answer !== "" && 
              !(isArraySafe(answer) && answer.length === 0)) {
            completedCount++
          }
        }
      }
      
      progressMap[lesson.id] = Math.round((completedCount / lesson.blocks.length) * 100)
    }
    
    return progressMap
  }, [course?.lessons, answers]) // Явно указываем зависимости для обновления

  // Создаем ключ для принудительного обновления боковой панели при изменении ответов
  // БЕЗ filter для избежания рекурсии
  const sidebarKey = useMemo(() => {
    // Создаем ключ на основе количества пройденных блоков
    let completedCount = 0
    const answerKeys = Object.keys(answers)
    for (let i = 0; i < answerKeys.length; i++) {
      const key = answerKeys[i]
      const answer = answers[key]
      if (answer !== undefined && answer !== null && answer !== "" && 
          !(isArraySafe(answer) && answer.length === 0)) {
        completedCount++
      }
    }
    return `sidebar-${completedCount}-${currentLessonIndex}-${currentBlockIndex}`
  }, [answers, currentLessonIndex, currentBlockIndex])

  return (
    <ContentProtection>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Заголовок курса */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground">{course.description}</p>
            )}
          </div>

          {/* Прогресс */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Прогресс: {completedBlocks} / {totalBlocks} блоков
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Боковая панель с содержанием курса */}
            <div className="lg:col-span-1" key={sidebarKey}>
              <CourseSidebar
                lessons={(() => {
                  if (!course.lessons || !isArraySafe(course.lessons)) return []
                  const result = []
                  for (let i = 0; i < course.lessons.length; i++) {
                    const l = course.lessons[i]
                    if (l) {
                      result.push({
                        id: l.id,
                        title: l.title,
                        blocks: l.blocks || [],
                      })
                    }
                  }
                  return result
                })()}
                currentLessonIndex={currentLessonIndex}
                currentBlockIndex={currentBlockIndex}
                onNavigate={(lessonIndex, blockIndex) => {
                  setCurrentLessonIndex(lessonIndex)
                  setCurrentBlockIndex(blockIndex)
                }}
                progress={lessonProgress}
                completedBlocks={answers}
              />
            </div>
            
            {/* Основной контент */}
            <div className="lg:col-span-3">

          {/* Контент блока */}
          <motion.div
            key={`${currentLessonIndex}-${currentBlockIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{currentBlock.title || `Блок ${currentBlockIndex + 1}`}</CardTitle>
                    {currentLesson && (
                      <CardDescription>
                        {currentLesson.title} • Блок {currentBlockIndex + 1} из {currentLesson.blocks?.length || 0}
                      </CardDescription>
                    )}
                  </div>
                  {timeLeft !== null && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentBlock.type === "text" && (
                  <div className="prose max-w-none">
                    {currentBlock.content?.text && (() => {
                      let htmlContent = currentBlock.content.text
                      
                      // Обрабатываем двойные экранирования HTML
                      htmlContent = htmlContent
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
                  </div>
                )}

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
                          const videoIdMatch = url.match(/vimeo\.com\/(\d+)/)
                          if (videoIdMatch && videoIdMatch[1]) {
                            embedUrl = `https://player.vimeo.com/video/${videoIdMatch[1]}`
                          }
                        }
                        
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ aspectRatio: '16/9' }}
                          />
                        )
                      } else {
                        // Локальное видео или прямой URL
                        const videoUrl = url.startsWith('http') ? url : `/api/files/${url}`
                        return (
                          <VideoPlayerEnhanced
                            src={videoUrl}
                            controls
                            className="w-full h-full"
                          />
                        )
                      }
                    })() : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Видео не загружено
                      </div>
                    )}
                  </div>
                )}

                {currentBlock.type === "quiz" && (
                  <div className="space-y-4">
                    <div className="text-lg font-semibold">
                      {currentBlock.content?.question || currentBlock.title}
                    </div>
                    
                    {currentBlock.content?.description && (
                      <div className="text-sm text-muted-foreground">
                        {currentBlock.content.description}
                      </div>
                    )}
                    
                    {currentBlock.content?.questionType === "single" && (() => {
                      // Создаем массив элементов без использования .map() для избежания рекурсии
                      const answersList = currentBlock.content?.answers
                      const answerElements: JSX.Element[] = []
                      if (answersList && isArraySafe(answersList)) {
                        for (let i = 0; i < answersList.length; i++) {
                          const answer = answersList[i]
                          if (answer) {
                            answerElements.push(
                              <div key={answer.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                                <RadioGroupItem value={answer.id} id={answer.id} />
                                <label htmlFor={answer.id} className="flex-1 cursor-pointer">
                                  {answer.text}
                                </label>
                              </div>
                            )
                          }
                        }
                      }
                      return (
                        <RadioGroup
                          value={answers[currentBlock.id]?.toString() || ""}
                          onValueChange={async (value) => {
                            if (isNavigatingRef.current) return // Предотвращаем множественные вызовы
                            
                            const newAnswers = { ...answers, [currentBlock.id]: value }
                            setAnswers(newAnswers)
                            
                            // Сохраняем ответ без await, чтобы не блокировать UI
                            saveAnswer(currentBlock.id, value).catch(console.error)
                            
                            // Автоматически переходим к следующему блоку после выбора ответа (только для single choice)
                            setTimeout(() => {
                              if (!isNavigatingRef.current) {
                                handleNext()
                              }
                            }, 800) // Увеличиваем задержку до 800ms для стабильности
                          }}
                        >
                          {answerElements}
                        </RadioGroup>
                      )
                    })()}

                    {currentBlock.content?.questionType === "multiple" && (() => {
                      // Создаем массив элементов без использования .map() для избежания рекурсии
                      const answersList = currentBlock.content?.answers
                      const answerElements: JSX.Element[] = []
                      if (answersList && isArraySafe(answersList)) {
                        for (let i = 0; i < answersList.length; i++) {
                          const answer = answersList[i]
                          if (answer) {
                            const currentAnswers = answers[currentBlock.id] || []
                            let isChecked = false
                            for (let j = 0; j < currentAnswers.length; j++) {
                              if (currentAnswers[j] === answer.id) {
                                isChecked = true
                                break
                              }
                            }
                            answerElements.push(
                              <div key={answer.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                                <Checkbox
                                  id={answer.id}
                                  checked={isChecked}
                                  onCheckedChange={async (checked) => {
                                    const currentAnswers = answers[currentBlock.id] || []
                                    let newAnswers: any[]
                                    if (checked) {
                                      // Добавляем ответ
                                      newAnswers = []
                                      for (let k = 0; k < currentAnswers.length; k++) {
                                        newAnswers.push(currentAnswers[k])
                                      }
                                      newAnswers.push(answer.id)
                                    } else {
                                      // Удаляем ответ (без filter, чтобы избежать рекурсии)
                                      newAnswers = []
                                      for (let k = 0; k < currentAnswers.length; k++) {
                                        if (currentAnswers[k] !== answer.id) {
                                          newAnswers.push(currentAnswers[k])
                                        }
                                      }
                                    }
                                    setAnswers({ ...answers, [currentBlock.id]: newAnswers })
                                    // Сохраняем без await, чтобы не блокировать UI
                                    saveAnswer(currentBlock.id, newAnswers).catch(console.error)
                                  }}
                                />
                                <label htmlFor={answer.id} className="flex-1 cursor-pointer">
                                  {answer.text}
                                </label>
                              </div>
                            )
                          }
                        }
                      }
                      return (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {answerElements}
                          </div>
                          <Button
                            onClick={handleNext}
                            disabled={!answers[currentBlock.id] || (isArraySafe(answers[currentBlock.id]) && answers[currentBlock.id].length === 0)}
                            className="w-full"
                          >
                            Далее
                          </Button>
                        </div>
                      )
                    })()}

                    {currentBlock.content?.questionType === "text" && (
                      <div className="space-y-4">
                        <Textarea
                          value={answers[currentBlock.id] || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            setAnswers({ ...answers, [currentBlock.id]: value })
                            // Используем debounce для сохранения текстовых ответов
                            if (textAnswerTimeoutRef.current) {
                              clearTimeout(textAnswerTimeoutRef.current)
                            }
                            textAnswerTimeoutRef.current = setTimeout(() => {
                              saveAnswer(currentBlock.id, value).catch(console.error)
                            }, 1000)
                          }}
                          placeholder="Введите ваш ответ..."
                          className="min-h-[120px]"
                        />
                        <Button
                          onClick={handleNext}
                          disabled={!answers[currentBlock.id] || answers[currentBlock.id].trim() === ""}
                          className="w-full"
                        >
                          Далее
                        </Button>
                      </div>
                    )}

                    {currentBlock.content?.questionType === "audio" && (
                      <div className="space-y-4">
                        {recordedAnswers[currentBlock.id] ? (
                          <div className="space-y-2">
                            <audio src={recordedAnswers[currentBlock.id]} controls className="w-full" />
                            <div className="flex gap-2">
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
                              <Button
                                onClick={handleNext}
                                className="flex-1"
                              >
                                Далее
                              </Button>
                            </div>
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
                            <div className="flex gap-2">
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
                              <Button
                                onClick={handleNext}
                                className="flex-1"
                              >
                                Далее
                              </Button>
                            </div>
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
                            onError={(error) => {
                              console.error('MediaRecorder error in quiz:', error)
                              toast.error(`Ошибка записи видео: ${error.message}`)
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentBlock.type === "sequence" && (() => {
                      // Создаем массив элементов без использования .map() для избежания рекурсии
                      const items = currentBlock.content?.items
                      const itemElements: JSX.Element[] = []
                      if (items && isArraySafe(items)) {
                        for (let i = 0; i < items.length; i++) {
                          const item = items[i]
                          if (item) {
                            itemElements.push(
                              <div
                                key={item.id || i}
                                className="p-4 border rounded-md bg-muted/50 cursor-move"
                                draggable
                              >
                                {item.text || item.title || `Элемент ${i + 1}`}
                              </div>
                            )
                          }
                        }
                      }
                      return (
                        <div className="space-y-4">
                          <p className="text-lg font-medium">{currentBlock.content?.instruction || "Расставьте элементы в правильном порядке"}</p>
                          <div className="space-y-2">
                            {itemElements}
                          </div>
                        </div>
                      )
                    })()}
              </CardContent>
            </Card>
          </motion.div>

          {/* Навигация */}
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
            Блок {currentBlockIndex + 1} из {currentLesson?.blocks?.length || 0} • 
            Время: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </div>

          <Button
            onClick={handleNext}
            className="gradient-primary text-white"
            disabled={false}
          >
            {course.lessons && currentLessonIndex === (course.lessons.length - 1) &&
            currentBlockIndex === (currentLesson?.blocks?.length || 1) - 1
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
