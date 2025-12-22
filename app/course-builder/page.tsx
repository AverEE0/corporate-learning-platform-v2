"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, Plus, Save, ArrowLeft, Trash2, Edit, 
  Video, Volume2, FileText, HelpCircle,   Image as ImageIcon,
  GripVertical, Play, Upload, X, ListOrdered, FileUp, Eye
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { getCSRFToken } from "@/lib/csrf-client"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { SortableList } from "@/components/ui/sortable-list"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { CoursePreviewModal } from "@/components/course-preview-modal"

interface Lesson {
  id: string
  title: string
  description: string
  blocks: Block[]
}

interface Block {
  id: string
  type: "text" | "video" | "audio" | "image" | "quiz" | "sequence" | "file-upload"
  title: string
  content: any
  order: number
}

interface QuizAnswer {
  id: string
  text: string
  isCorrect: boolean
}

function CourseBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [courseStatus, setCourseStatus] = useState<"draft" | "published">("draft")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
  const [courseId, setCourseId] = useState<number | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(false)
  const [courseLoaded, setCourseLoaded] = useState(false)
  const [lastLoadedCourseId, setLastLoadedCourseId] = useState<number | null>(null)

  // Функция для получения courseId из URL
  const getCourseIdFromURL = () => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const courseIdParam = params.get('courseId')
    return courseIdParam && !isNaN(parseInt(courseIdParam)) ? parseInt(courseIdParam) : null
  }

  // Проверка авторизации
  useEffect(() => {
    if (authLoading) return
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      router.push('/dashboard')
      return
    }
  }, [user, router, authLoading])

  // Проверка courseId при монтировании и при изменении URL
  useEffect(() => {
    if (authLoading) return
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) return

    const checkAndLoadCourse = () => {
      const id = getCourseIdFromURL()
      const courseIdFromParams = searchParams.get('courseId')
      const finalId = id || (courseIdFromParams && !isNaN(parseInt(courseIdFromParams)) ? parseInt(courseIdFromParams) : null)
      
      console.log('Checking courseId on mount/URL change:', {
        fromWindow: id,
        fromSearchParams: courseIdFromParams,
        final: finalId,
        lastLoaded: lastLoadedCourseId,
        courseLoaded: courseLoaded
      })
      
      if (finalId && finalId !== lastLoadedCourseId) {
        console.log('Loading course from URL:', finalId)
        loadCourse(finalId)
      } else if (!finalId && lastLoadedCourseId !== null && courseLoaded) {
        console.log('No courseId in URL, resetting state')
        setCourseId(null)
        setCourseTitle("")
        setCourseDescription("")
        setCourseStatus("draft")
        setLessons([])
        setSelectedLesson(null)
        setCourseLoaded(false)
        setLastLoadedCourseId(null)
      }
    }

    // Проверяем сразу при монтировании и при изменении зависимостей
    checkAndLoadCourse()

    // Слушаем изменения URL через popstate (для кнопки назад/вперед)
    const handleLocationChange = () => {
      setTimeout(checkAndLoadCourse, 100)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleLocationChange)
      
      // Также слушаем изменения через hashchange (на случай если используется hash)
      window.addEventListener('hashchange', handleLocationChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleLocationChange)
        window.removeEventListener('hashchange', handleLocationChange)
      }
    }
  }, [user, authLoading, searchParams, lastLoadedCourseId, courseLoaded])


  async function loadCourse(id: number) {
    // Предотвращаем повторную загрузку того же курса
    if (lastLoadedCourseId === id && courseLoaded) {
      console.log('Course already loaded, skipping:', id)
      return
    }

    setLoadingCourse(true)
    setCourseLoaded(false)
    try {
      console.log('Loading course:', id)
      const response = await fetch(`/api/courses/${id}`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to load course:', errorData)
        toast.error(errorData.error || 'Ошибка загрузки курса')
        setLastLoadedCourseId(null)
        return
      }

      const data = await response.json()
      console.log('Course data loaded:', data)
      
      if (data.success && data.course) {
        setCourseId(data.course.id)
        setCourseTitle(data.course.title || "")
        setCourseDescription(data.course.description || "")
        setCourseStatus(data.course.status || "draft")

        // Преобразуем уроки из базы в формат редактора
        const loadedLessons: Lesson[] = (data.course.lessons || []).map((lesson: any) => ({
          id: `lesson-${lesson.id}`,
          title: lesson.title || "Новый урок",
          description: lesson.description || "",
          blocks: (lesson.blocks || []).map((block: any) => {
            // Правильно обрабатываем content - может быть JSON строка или объект
            let blockContent: any = block.content || {}
            if (typeof blockContent === 'string') {
              try {
                blockContent = JSON.parse(blockContent)
              } catch (e) {
                console.error('Error parsing block content:', e)
                blockContent = {}
              }
            }
            
            // Убеждаемся, что для текстовых блоков есть поле text
            if (block.type === 'text' && !blockContent.text && typeof blockContent === 'object') {
              // Если content пустой объект, инициализируем пустым текстом
              blockContent = { text: blockContent.text || '' }
            }
            
            return {
              id: `block-${block.id}`,
              type: block.type,
              title: block.title || "Блок",
              content: blockContent,
              order: block.order_index || 0,
            }
          }),
        }))

        console.log('Loaded lessons:', loadedLessons)
        setLessons(loadedLessons)
        if (loadedLessons.length > 0) {
          setSelectedLesson(loadedLessons[0].id)
        }
        setCourseLoaded(true)
        setLastLoadedCourseId(id)
        toast.success('Курс загружен для редактирования')
      } else {
        console.error('Invalid course data:', data)
        toast.error('Не удалось загрузить данные курса')
        setLastLoadedCourseId(null)
      }
    } catch (error: any) {
      console.error('Error loading course:', error)
      toast.error('Ошибка загрузки курса: ' + (error.message || 'Неизвестная ошибка'))
      setLastLoadedCourseId(null)
    } finally {
      setLoadingCourse(false)
    }
  }

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: "Новый урок",
      description: "",
      blocks: [],
    }
    setLessons([...lessons, newLesson])
    setSelectedLesson(newLesson.id)
  }

  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    setLessons(lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l))
  }

  const deleteLesson = (lessonId: string) => {
    setLessons(lessons.filter(l => l.id !== lessonId))
    if (selectedLesson === lessonId) {
      setSelectedLesson(null)
    }
  }

  const addBlock = (lessonId: string, type: Block["type"]) => {
    const baseContent: any = {}
    
    // Инициализация контента для тестов
    if (type === "quiz") {
      baseContent.questionType = "single" // single, multiple, text, audio, video
      baseContent.question = ""
      baseContent.answers = []
      baseContent.allowMultipleAnswers = false
    }
    
      const titleMap: Record<string, string> = {
        text: "Текстовый блок",
        video: "Видео блок",
        audio: "Аудио блок",
        quiz: "Тест",
        image: "Изображение",
        sequence: "Расстановка последовательности",
        "file-upload": "Загрузка файла",
      }

      if (type === "sequence") {
        baseContent.items = []
        baseContent.correctOrder = []
      }
      if (type === "file-upload") {
        baseContent.allowedTypes = ["document", "image"]
        baseContent.maxSize = 10 // MB
      }

      const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      title: titleMap[type] || "Блок",
      content: baseContent,
      order: lessons.find(l => l.id === lessonId)?.blocks.length || 0,
    }
    updateLesson(lessonId, {
      blocks: [...(lessons.find(l => l.id === lessonId)?.blocks || []), newBlock],
    })
  }

  const addQuizAnswer = (lessonId: string, blockId: string) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return
    const block = lesson.blocks.find(b => b.id === blockId)
    if (!block || block.type !== "quiz") return

    const newAnswer: QuizAnswer = {
      id: `answer-${Date.now()}`,
      text: "",
      isCorrect: false,
    }
    const updatedAnswers = [...(block.content.answers || []), newAnswer]
    updateBlock(lessonId, blockId, {
      content: { ...block.content, answers: updatedAnswers },
    })
  }

  const updateQuizAnswer = (lessonId: string, blockId: string, answerId: string, updates: Partial<QuizAnswer>) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return
    const block = lesson.blocks.find(b => b.id === blockId)
    if (!block || block.type !== "quiz") return

    const updatedAnswers = (block.content.answers || []).map((a: QuizAnswer) =>
      a.id === answerId ? { ...a, ...updates } : a
    )
    updateBlock(lessonId, blockId, {
      content: { ...block.content, answers: updatedAnswers },
    })
  }

  const deleteQuizAnswer = (lessonId: string, blockId: string, answerId: string) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return
    const block = lesson.blocks.find(b => b.id === blockId)
    if (!block || block.type !== "quiz") return

    const updatedAnswers = (block.content.answers || []).filter((a: QuizAnswer) => a.id !== answerId)
    updateBlock(lessonId, blockId, {
      content: { ...block.content, answers: updatedAnswers },
    })
  }

  const handleFileUpload = async (file: File, type: "video" | "audio" | "image", lessonId: string, blockId: string): Promise<string> => {
    const uploadKey = `${lessonId}-${blockId}-${type}`
    
    // Проверка размера файла перед загрузкой
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      toast.error(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`)
      throw new Error(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`)
    }

    if (file.size === 0) {
      toast.error("Файл пустой")
      throw new Error("Файл пустой")
    }

    // Показываем уведомление о начале загрузки
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
    toast.info(`Начата загрузка ${file.name} (${fileSizeMB} MB)`, { duration: 3000 })

    setUploading(prev => ({ ...prev, [uploadKey]: true }))
    setUploadProgress(prev => ({ ...prev, [uploadKey]: 0 }))

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    // Используем XMLHttpRequest для отслеживания прогресса
    try {
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Отслеживаем прогресс загрузки
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(prev => ({ ...prev, [uploadKey]: percentComplete }))
          }
        })

        // Обработка успешного завершения
        xhr.addEventListener('load', () => {
          setUploading(prev => ({ ...prev, [uploadKey]: false }))
          setUploadProgress(prev => ({ ...prev, [uploadKey]: 100 }))

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              if (result.success && result.url) {
                const fileUrl = result.url || result.file?.url
                updateBlock(lessonId, blockId, {
                  content: { url: fileUrl },
                })
                toast.success("Файл загружен успешно")
                
                // Очищаем прогресс через секунду
                setTimeout(() => {
                  setUploadProgress(prev => {
                    const newState = { ...prev }
                    delete newState[uploadKey]
                    return newState
                  })
                }, 1000)
                
                // Возвращаем полный URL
                const fullUrl = fileUrl.startsWith('/') || fileUrl.startsWith('http') ? fileUrl : `/api/files/${fileUrl}`
                resolve(fullUrl)
              } else {
                toast.error(result.error || "Ошибка загрузки файла")
                reject(new Error(result.error || "Ошибка загрузки файла"))
              }
            } catch (parseError) {
              console.error('Error parsing response:', parseError)
              toast.error("Ошибка обработки ответа сервера")
              reject(parseError)
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              toast.error(errorData.error || `Ошибка загрузки файла (${xhr.status})`)
            } catch {
              toast.error(`Ошибка загрузки файла (${xhr.status})`)
            }
            reject(new Error(`HTTP ${xhr.status}`))
          }
        })

        // Обработка ошибок
        xhr.addEventListener('error', () => {
          setUploading(prev => ({ ...prev, [uploadKey]: false }))
          setUploadProgress(prev => {
            const newState = { ...prev }
            delete newState[uploadKey]
            return newState
          })
          toast.error("Ошибка сети при загрузке файла")
          console.error('Upload network error')
          reject(new Error('Network error'))
        })

        // Обработка отмены
        xhr.addEventListener('abort', () => {
          setUploading(prev => ({ ...prev, [uploadKey]: false }))
          setUploadProgress(prev => {
            const newState = { ...prev }
            delete newState[uploadKey]
            return newState
          })
          toast.info("Загрузка отменена")
          reject(new Error('Upload aborted'))
        })

        // Настраиваем и отправляем запрос
        xhr.open('POST', '/api/upload')
        xhr.withCredentials = true // Важно для отправки cookies
        
        // НЕ устанавливаем Content-Type вручную - браузер установит его автоматически с boundary
        // Это критически важно для FormData
        
        xhr.send(formData)
      })
    } catch (error: any) {
      setUploading(prev => ({ ...prev, [uploadKey]: false }))
      setUploadProgress(prev => {
        const newState = { ...prev }
        delete newState[uploadKey]
        return newState
      })
      console.error('Upload error:', error)
      toast.error(error?.message || "Ошибка загрузки файла")
      return Promise.reject(error)
    }
  }

  const updateBlock = (lessonId: string, blockId: string, updates: Partial<Block>) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return

    const updatedBlocks = lesson.blocks.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    )
    updateLesson(lessonId, { blocks: updatedBlocks })
  }

  const deleteBlock = (lessonId: string, blockId: string) => {
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return

    updateLesson(lessonId, {
      blocks: lesson.blocks.filter(b => b.id !== blockId),
    })
  }

  const handleSave = async () => {
    if (!courseTitle.trim()) {
      toast.error("Введите название курса")
      return
    }

    if (lessons.length === 0) {
      toast.error("Добавьте хотя бы один урок")
      return
    }

    setIsSaving(true)

    try {
      // Получаем CSRF токен используя клиентскую функцию
      let csrfToken: string
      try {
        csrfToken = await getCSRFToken()
      } catch (csrfError) {
        console.error('Error getting CSRF token:', csrfError)
        toast.error('Ошибка получения CSRF токена. Попробуйте перезагрузить страницу.')
        setIsSaving(false)
        return
      }

      // Создаем или обновляем курс
      let savedCourseId: number
      
      if (courseId) {
        // Обновляем существующий курс
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            title: courseTitle,
            description: courseDescription,
            status: courseStatus,
          }),
        })

        const courseData = await courseResponse.json()

        if (!courseResponse.ok) {
          throw new Error(courseData.error || 'Ошибка обновления курса')
        }

        if (!courseData.course || !courseData.course.id) {
          throw new Error('Курс не был обновлен корректно')
        }

        savedCourseId = courseData.course.id
      } else {
        // Создаем новый курс
        const courseResponse = await fetch('/api/courses', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            title: courseTitle,
            description: courseDescription,
            status: courseStatus,
          }),
        })

        const courseData = await courseResponse.json()

        if (!courseResponse.ok) {
          throw new Error(courseData.error || 'Ошибка создания курса')
        }

        if (!courseData.course || !courseData.course.id) {
          throw new Error('Курс не был создан корректно')
        }

        savedCourseId = courseData.course.id
        setCourseId(savedCourseId)
      }

      // Получаем существующие уроки и блоки для сравнения
      const existingLessonsResponse = await fetch(`/api/courses/${savedCourseId}`)
      const existingData = existingLessonsResponse.ok ? await existingLessonsResponse.json() : { course: { lessons: [] } }
      const existingLessons = existingData.course?.lessons || []

      // Удаляем уроки, которых больше нет в новом списке
      const currentLessonIds = lessons
        .filter(l => l.id.startsWith('lesson-'))
        .map(l => parseInt(l.id.replace('lesson-', '')))
      
      for (const existingLesson of existingLessons) {
        if (!currentLessonIds.includes(existingLesson.id)) {
          await fetch(`/api/courses/lessons/${existingLesson.id}`, {
            method: 'DELETE',
            headers: { 
              'x-csrf-token': csrfToken,
            },
            credentials: 'include',
          })
        }
      }

      // Сохраняем уроки и блоки
      for (const lesson of lessons) {
        try {
          // Проверяем, существует ли урок (по ID из базы)
          const lessonIdFromDb = lesson.id.startsWith('lesson-') ? parseInt(lesson.id.replace('lesson-', '')) : null
          const existingLesson = existingLessons.find((l: any) => l.id === lessonIdFromDb)
          
          let lessonId: number
          
          if (existingLesson) {
            // Обновляем существующий урок
            const lessonResponse = await fetch(`/api/courses/lessons/${existingLesson.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken,
              },
              credentials: 'include',
              body: JSON.stringify({
                title: lesson.title,
                description: lesson.description,
                orderIndex: lessons.indexOf(lesson),
              }),
            })

            const lessonData = await lessonResponse.json()

            if (!lessonResponse.ok) {
              console.error('Error updating lesson:', lessonData.error)
              toast.error(`Ошибка обновления урока "${lesson.title}": ${lessonData.error || 'Неизвестная ошибка'}`)
              continue
            }

            if (!lessonData.lesson || !lessonData.lesson.id) {
              console.error('Lesson was not updated correctly:', lessonData)
              continue
            }

            lessonId = lessonData.lesson.id
            
            // Удаляем старые блоки, которых нет в новом списке
            const existingBlocksForDeletion = existingLesson.blocks || []
            const currentBlockIds = lesson.blocks
              .filter(b => b.id.startsWith('block-'))
              .map(b => parseInt(b.id.replace('block-', '')))
            
            for (const existingBlock of existingBlocksForDeletion) {
              if (!currentBlockIds.includes(existingBlock.id)) {
                await fetch(`/api/courses/blocks/${existingBlock.id}`, {
                  method: 'DELETE',
                  headers: { 
                    'x-csrf-token': csrfToken,
                  },
                  credentials: 'include',
                })
              }
            }
          } else {
            // Создаем новый урок
            const lessonResponse = await fetch('/api/courses/lessons', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken,
              },
              credentials: 'include',
              body: JSON.stringify({
                courseId: savedCourseId,
                title: lesson.title,
                description: lesson.description,
                orderIndex: lessons.indexOf(lesson),
              }),
            })

            const lessonData = await lessonResponse.json()

            if (!lessonResponse.ok) {
              console.error('Error creating lesson:', lessonData.error)
              toast.error(`Ошибка создания урока "${lesson.title}": ${lessonData.error || 'Неизвестная ошибка'}`)
              continue
            }

            if (!lessonData.lesson || !lessonData.lesson.id) {
              console.error('Lesson was not created correctly:', lessonData)
              continue
            }

            lessonId = lessonData.lesson.id
          }

          // Сохраняем блоки
          const existingBlocks = existingLesson?.blocks || []
          
          for (const block of lesson.blocks) {
            try {
              // Проверяем, существует ли блок (по ID из базы)
              const blockIdFromDb = block.id.startsWith('block-') ? parseInt(block.id.replace('block-', '')) : null
              const existingBlock = existingBlocks.find((b: any) => b.id === blockIdFromDb)
              
              if (existingBlock) {
                // Обновляем существующий блок
                const blockResponse = await fetch(`/api/courses/blocks/${existingBlock.id}`, {
                  method: 'PUT',
                  headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    type: block.type,
                    title: block.title,
                    content: block.content,
                    orderIndex: lesson.blocks.indexOf(block),
                  }),
                })

                const blockData = await blockResponse.json()

                if (!blockResponse.ok) {
                  console.error('Error updating block:', blockData.error)
                  toast.error(`Ошибка обновления блока "${block.title}": ${blockData.error || 'Неизвестная ошибка'}`)
                  continue
                }
              } else {
                // Создаем новый блок
                const blockResponse = await fetch('/api/courses/blocks', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    lessonId: lessonId,
                    type: block.type,
                    title: block.title,
                    content: block.content,
                    orderIndex: lesson.blocks.indexOf(block),
                  }),
                })

                const blockData = await blockResponse.json()

                if (!blockResponse.ok) {
                  console.error('Error creating block:', blockData.error)
                  toast.error(`Ошибка создания блока "${block.title}": ${blockData.error || 'Неизвестная ошибка'}`)
                  continue
                }
              }
            } catch (blockError: any) {
              console.error('Error saving block:', blockError)
              toast.error(`Ошибка сохранения блока "${block.title}"`)
            }
          }
        } catch (lessonError: any) {
          console.error('Error creating lesson:', lessonError)
          toast.error(`Ошибка создания урока "${lesson.title}": ${lessonError.message || 'Неизвестная ошибка'}`)
        }
      }

      toast.success(courseId ? "Курс успешно обновлен!" : "Курс успешно создан!")
      router.push('/manager/dashboard')
    } catch (error: any) {
      toast.error(error.message || "Ошибка сохранения курса")
    } finally {
      setIsSaving(false)
    }
  }

  const currentLesson = lessons.find(l => l.id === selectedLesson)

  return (
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
                <h1 className="text-xl font-bold">Конструктор курсов</h1>
                <p className="text-sm text-muted-foreground">Создайте новый курс</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setPreviewOpen(true)}
                variant="outline"
                disabled={!courseTitle.trim() || lessons.length === 0}
                className="hidden sm:flex"
              >
                <Eye className="mr-2 h-4 w-4" />
                Предпросмотр
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gradient-primary text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Сохранение..." : "Сохранить курс"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loadingCourse ? (
          <Card className="gradient-card border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Загрузка курса...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Course Info & Lessons */}
            <div className="lg:col-span-1 space-y-6">
              {/* Course Info */}
              <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Информация о курсе</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название курса *</Label>
                  <Input
                    id="title"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Введите название курса"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <textarea
                    id="description"
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Описание курса"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Статус курса</Label>
                  <Select value={courseStatus} onValueChange={(value: "draft" | "published") => setCourseStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="published">Опубликован</SelectItem>
                    </SelectContent>
                  </Select>
                  {courseStatus === "draft" && (
                    <p className="text-xs text-muted-foreground">
                      💡 Черновик виден только вам. Студенты его не увидят до публикации.
                    </p>
                  )}
                  {courseStatus === "published" && (
                    <p className="text-xs text-muted-foreground">
                      ✅ Курс будет виден всем студентам после сохранения.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lessons List */}
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Уроки ({lessons.length})</CardTitle>
                <Button onClick={addLesson} size="sm" className="gradient-primary text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Добавьте первый урок
                  </p>
                ) : (
                  <SortableList
                    items={lessons}
                    onReorder={(newLessons: Lesson[]) => setLessons(newLessons)}
                  >
                    {(lesson: Lesson, index: number) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedLesson === lesson.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedLesson(lesson.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{lesson.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                {lesson.blocks.length} блоков
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {lesson.description || "Без описания"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteLesson(lesson.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </SortableList>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Lesson Editor */}
          <div className="lg:col-span-2">
            {!selectedLesson || !currentLesson ? (
              <Card className="gradient-card border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Выберите урок для редактирования или создайте новый
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Lesson Header */}
                <Card className="gradient-card border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={currentLesson.title}
                          onChange={(e) => updateLesson(selectedLesson, { title: e.target.value })}
                          className="text-xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
                          placeholder="Название урока"
                        />
                        <textarea
                          value={currentLesson.description}
                          onChange={(e) => updateLesson(selectedLesson, { description: e.target.value })}
                          placeholder="Описание урока"
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Blocks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Блоки урока</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "text")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Текст
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "video")}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Видео
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "audio")}
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Аудио
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "image")}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Изображение
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "quiz")}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Тест
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "sequence")}
                      >
                        <ListOrdered className="mr-2 h-4 w-4" />
                        Последовательность
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addBlock(selectedLesson, "file-upload")}
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Загрузка файла
                      </Button>
                    </div>
                  </div>

                  {currentLesson.blocks.length === 0 ? (
                    <Card className="gradient-card border-0 shadow-lg">
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">
                          Добавьте блоки к уроку
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <SortableList
                      items={currentLesson.blocks}
                      onReorder={(newBlocks) => {
                        const updatedBlocks = newBlocks.map((b: Block, idx: number) => ({ ...b, order: idx }))
                        updateLesson(selectedLesson, { blocks: updatedBlocks })
                      }}
                    >
                      {(block, index) => (
                        <motion.div
                          key={block.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="gradient-card border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    {block.type === "text" && <FileText className="h-4 w-4" />}
                                    {block.type === "video" && <Video className="h-4 w-4" />}
                                    {block.type === "audio" && <Volume2 className="h-4 w-4" />}
                                    {block.type === "quiz" && <HelpCircle className="h-4 w-4" />}
                                    <Input
                                      value={block.title}
                                      onChange={(e) => updateBlock(selectedLesson, block.id, { title: e.target.value })}
                                      className="border-0 bg-transparent p-0 font-semibold focus-visible:ring-0"
                                    />
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteBlock(selectedLesson, block.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </CardHeader>
                          <CardContent>
                            {block.type === "text" && (
                              <div>
                                <Label>Содержание текстового блока</Label>
                                <RichTextEditor
                                  value={block.content?.text || ""}
                                  onChange={(value) => updateBlock(selectedLesson, block.id, {
                                    content: { ...block.content, text: value },
                                  })}
                                  placeholder="Введите текст блока"
                                  onImageUpload={async (file) => {
                                    return await handleFileUpload(file, "image", selectedLesson, block.id)
                                  }}
                                  onVideoUpload={async (file) => {
                                    return await handleFileUpload(file, "video", selectedLesson, block.id)
                                  }}
                                />
                              </div>
                            )}
                            {block.type === "video" && (
                              <div className="space-y-2">
                                <Label>Видео файл</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={block.content?.url || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, url: e.target.value },
                                    })}
                                    placeholder="URL видео или путь к файлу"
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="video/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handleFileUpload(file, "video", selectedLesson, block.id)
                                        }
                                      }}
                                      disabled={uploading[`${selectedLesson}-${block.id}-video`]}
                                    />
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm" 
                                      asChild
                                      disabled={uploading[`${selectedLesson}-${block.id}-video`]}
                                    >
                                      <span>
                                        <Upload className="h-4 w-4 mr-1" />
                                        {uploading[`${selectedLesson}-${block.id}-video`] ? 'Загрузка...' : 'Загрузить'}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                                {uploading[`${selectedLesson}-${block.id}-video`] && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                      <span>Загрузка видео...</span>
                                      <span>{uploadProgress[`${selectedLesson}-${block.id}-video`] || 0}%</span>
                                    </div>
                                    <Progress value={uploadProgress[`${selectedLesson}-${block.id}-video`] || 0} className="h-2" />
                                  </div>
                                )}
                                {block.content?.url && (() => {
                                  const url = block.content.url
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
                                      <div className="mt-2 aspect-video bg-muted rounded-md overflow-hidden">
                                        <iframe
                                          src={embedUrl}
                                          className="w-full h-full"
                                          frameBorder="0"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          title="Видео"
                                        />
                                      </div>
                                    )
                                  }
                                  
                                  // Для локальных файлов или прямых ссылок используем video тег
                                  return (
                                    <div className="mt-2 aspect-video bg-muted rounded-md overflow-hidden">
                                      <video 
                                        src={url.startsWith('/') || url.startsWith('http') 
                                          ? url 
                                          : `/api/files/${url}`} 
                                        controls 
                                        className="w-full h-full object-contain" 
                                      />
                                    </div>
                                  )
                                })()}
                              </div>
                            )}
                            {block.type === "audio" && (
                              <div className="space-y-2">
                                <Label>Аудио файл</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={block.content?.url || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, url: e.target.value },
                                    })}
                                    placeholder="URL аудио или путь к файлу"
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handleFileUpload(file, "audio", selectedLesson, block.id)
                                        }
                                      }}
                                      disabled={uploading[`${selectedLesson}-${block.id}-audio`]}
                                    />
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm" 
                                      asChild
                                      disabled={uploading[`${selectedLesson}-${block.id}-audio`]}
                                    >
                                      <span>
                                        <Upload className="h-4 w-4 mr-1" />
                                        {uploading[`${selectedLesson}-${block.id}-audio`] ? 'Загрузка...' : 'Загрузить'}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                                {uploading[`${selectedLesson}-${block.id}-audio`] && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                      <span>Загрузка аудио...</span>
                                      <span>{uploadProgress[`${selectedLesson}-${block.id}-audio`] || 0}%</span>
                                    </div>
                                    <Progress value={uploadProgress[`${selectedLesson}-${block.id}-audio`] || 0} className="h-2" />
                                  </div>
                                )}
                                {block.content?.url && (
                                  <div className="mt-2 bg-muted rounded-md p-4">
                                    <audio 
                                      src={block.content.url.startsWith('/') || block.content.url.startsWith('http')
                                        ? block.content.url 
                                        : `/api/files/${block.content.url}`} 
                                      controls 
                                      className="w-full" 
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {block.type === "image" && (
                              <div className="space-y-2">
                                <Label>Изображение</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={block.content?.url || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, url: e.target.value },
                                    })}
                                    placeholder="URL изображения или путь к файлу"
                                    className="flex-1"
                                  />
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handleFileUpload(file, "image", selectedLesson, block.id)
                                        }
                                      }}
                                      disabled={uploading[`${selectedLesson}-${block.id}-image`]}
                                    />
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="sm" 
                                      asChild
                                      disabled={uploading[`${selectedLesson}-${block.id}-image`]}
                                    >
                                      <span>
                                        <Upload className="h-4 w-4 mr-1" />
                                        {uploading[`${selectedLesson}-${block.id}-image`] ? 'Загрузка...' : 'Загрузить'}
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                                {uploading[`${selectedLesson}-${block.id}-image`] && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                      <span>Загрузка изображения...</span>
                                      <span>{uploadProgress[`${selectedLesson}-${block.id}-image`] || 0}%</span>
                                    </div>
                                    <Progress value={uploadProgress[`${selectedLesson}-${block.id}-image`] || 0} className="h-2" />
                                  </div>
                                )}
                                {block.content?.url && (
                                  <div className="mt-2 bg-muted rounded-md p-4">
                                    <img 
                                      src={block.content.url.startsWith('/') || block.content.url.startsWith('http')
                                        ? block.content.url 
                                        : `/api/files/${block.content.url}`} 
                                      alt="Загруженное изображение"
                                      className="max-w-full h-auto rounded-md"
                                      style={{ maxHeight: '500px' }}
                                    />
                                  </div>
                                )}
                                <div className="space-y-2 mt-4">
                                  <Label>Подпись к изображению (опционально)</Label>
                                  <Input
                                    value={block.content?.caption || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, caption: e.target.value },
                                    })}
                                    placeholder="Введите подпись к изображению"
                                  />
                                </div>
                              </div>
                            )}
                            {block.type === "quiz" && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Тип вопроса</Label>
                                  <Select
                                    value={block.content?.questionType || "single"}
                                    onValueChange={(value) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, questionType: value },
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="single">Одиночный выбор</SelectItem>
                                      <SelectItem value="multiple">Множественный выбор</SelectItem>
                                      <SelectItem value="text">Текстовый ответ</SelectItem>
                                      <SelectItem value="audio">Аудио ответ</SelectItem>
                                      <SelectItem value="video">Видео ответ</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Вопрос</Label>
                                  <Input
                                    value={block.content?.question || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, question: e.target.value },
                                    })}
                                    placeholder="Введите вопрос"
                                  />
                                </div>

                                {/* Варианты ответов для single/multiple */}
                                {(block.content?.questionType === "single" || block.content?.questionType === "multiple") && (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label>Варианты ответов</Label>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addQuizAnswer(selectedLesson, block.id)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Добавить ответ
                                      </Button>
                                    </div>
                                    
                                    {block.content?.answers?.length > 0 ? (
                                      <div className="space-y-2">
                                        {block.content.answers.map((answer: QuizAnswer) => (
                                          <div key={answer.id} className="flex items-center gap-2 p-2 border rounded-md">
                                            <Checkbox
                                              checked={answer.isCorrect}
                                              onCheckedChange={(checked) => 
                                                updateQuizAnswer(selectedLesson, block.id, answer.id, { isCorrect: !!checked })
                                              }
                                            />
                                            <Input
                                              value={answer.text}
                                              onChange={(e) => 
                                                updateQuizAnswer(selectedLesson, block.id, answer.id, { text: e.target.value })
                                              }
                                              placeholder="Текст ответа"
                                              className="flex-1"
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => deleteQuizAnswer(selectedLesson, block.id, answer.id)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        Добавьте варианты ответов
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Инструкции для других типов */}
                                {block.content?.questionType === "text" && (
                                  <p className="text-sm text-muted-foreground">
                                    Студент сможет ответить текстом на этот вопрос
                                  </p>
                                )}
                                {block.content?.questionType === "audio" && (
                                  <p className="text-sm text-muted-foreground">
                                    Студент сможет записать аудио ответ
                                  </p>
                                )}
                                {block.content?.questionType === "video" && (
                                  <p className="text-sm text-muted-foreground">
                                    Студент сможет записать видео ответ
                                  </p>
                                )}

                                {/* Настройки ветвления */}
                                <div className="mt-4 pt-4 border-t space-y-3">
                                  <Label>Настройки ветвления</Label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs">При правильном ответе:</Label>
                                      <Select
                                        value={block.content?.branching?.correctPath || "next"}
                                        onValueChange={(value) => {
                                          const currentContent = block.content || {}
                                          updateBlock(selectedLesson, block.id, {
                                            content: {
                                              ...currentContent,
                                              branching: {
                                                ...currentContent.branching,
                                                correctPath: value,
                                              },
                                            },
                                          })
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="next">Следующий блок</SelectItem>
                                          <SelectItem value="skip">Пропустить блок</SelectItem>
                                          <SelectItem value="specific">Перейти к блоку...</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">При неправильном ответе:</Label>
                                      <Select
                                        value={block.content?.branching?.incorrectPath || "next"}
                                        onValueChange={(value) => {
                                          const currentContent = block.content || {}
                                          updateBlock(selectedLesson, block.id, {
                                            content: {
                                              ...currentContent,
                                              branching: {
                                                ...currentContent.branching,
                                                incorrectPath: value,
                                              },
                                            },
                                          })
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="next">Следующий блок</SelectItem>
                                          <SelectItem value="repeat">Повторить блок</SelectItem>
                                          <SelectItem value="hint">Показать подсказку</SelectItem>
                                          <SelectItem value="specific">Перейти к блоку...</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  {(block.content?.branching?.correctPath === "specific" || 
                                    block.content?.branching?.incorrectPath === "specific") && (
                                    <div className="space-y-2">
                                      <Label className="text-xs">ID целевого блока (необязательно):</Label>
                                      <Input
                                        placeholder="block-id"
                                        value={block.content?.branching?.targetBlockId || ""}
                                        onChange={(e) => {
                                          const currentContent = block.content || {}
                                          updateBlock(selectedLesson, block.id, {
                                            content: {
                                              ...currentContent,
                                              branching: {
                                                ...currentContent.branching,
                                                targetBlockId: e.target.value,
                                              },
                                            },
                                          })
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <Label className="text-xs">Баллы за правильный ответ:</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={block.content?.points || 0}
                                      onChange={(e) => {
                                        const currentContent = block.content || {}
                                        updateBlock(selectedLesson, block.id, {
                                          content: {
                                            ...currentContent,
                                            points: parseInt(e.target.value) || 0,
                                          },
                                        })
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Ограничение по времени (секунды, 0 = без ограничения):</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={block.content?.timeLimit || 0}
                                      onChange={(e) => {
                                        const currentContent = block.content || {}
                                        updateBlock(selectedLesson, block.id, {
                                          content: {
                                            ...currentContent,
                                            timeLimit: parseInt(e.target.value) || 0,
                                          },
                                        })
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {block.type === "sequence" && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Инструкция</Label>
                                  <Input
                                    value={block.content?.instruction || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, instruction: e.target.value },
                                    })}
                                    placeholder="Например: Расставьте этапы в правильном порядке"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label>Элементы последовательности</Label>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const currentContent = block.content || {}
                                        const items = currentContent.items || []
                                        const newItem = {
                                          id: `item-${Date.now()}`,
                                          text: `Элемент ${items.length + 1}`,
                                          order: items.length,
                                        }
                                        updateBlock(selectedLesson, block.id, {
                                          content: {
                                            ...currentContent,
                                            items: [...items, newItem],
                                            correctOrder: [...items, newItem].map((item, idx) => idx),
                                          },
                                        })
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Добавить элемент
                                    </Button>
                                  </div>
                                  {block.content?.items?.length > 0 ? (
                                    <SortableList
                                      items={block.content.items}
                                      onReorder={(newItems: { id: string; text: string }[]) => {
                                        const currentContent = block.content || {}
                                        updateBlock(selectedLesson, block.id, {
                                          content: {
                                            ...currentContent,
                                            items: newItems,
                                            correctOrder: newItems.map((_, idx: number) => idx),
                                          },
                                        })
                                      }}
                                    >
                                      {(item: any, index: number) => (
                                        <div className="p-3 border rounded-md flex items-center gap-2">
                                          <Input
                                            value={item.text || ""}
                                            onChange={(e) => {
                                              const currentContent = block.content || {}
                                              const items = currentContent.items || []
                                              const updatedItems = items.map((it: any) =>
                                                it.id === item.id ? { ...it, text: e.target.value } : it
                                              )
                                              updateBlock(selectedLesson, block.id, {
                                                content: { ...currentContent, items: updatedItems },
                                              })
                                            }}
                                            className="flex-1"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const currentContent = block.content || {}
                                              const items = (currentContent.items || []).filter(
                                                (it: any) => it.id !== item.id
                                              )
                                              updateBlock(selectedLesson, block.id, {
                                                content: { ...currentContent, items },
                                              })
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </SortableList>
                                  ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      Добавьте элементы последовательности
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs">Баллы за правильный ответ:</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={block.content?.points || 0}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, points: parseInt(e.target.value) || 0 },
                                    })}
                                  />
                                </div>
                              </div>
                            )}

                            {block.type === "file-upload" && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Инструкция для студента</Label>
                                  <Input
                                    value={block.content?.instruction || ""}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, instruction: e.target.value },
                                    })}
                                    placeholder="Например: Загрузите документ с решением задачи"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Разрешенные типы файлов</Label>
                                  <div className="flex gap-2 flex-wrap">
                                    {["document", "image", "pdf"].map((type) => (
                                      <Button
                                        key={type}
                                        type="button"
                                        size="sm"
                                        variant={
                                          (block.content?.allowedTypes || []).includes(type)
                                            ? "default"
                                            : "outline"
                                        }
                                        onClick={() => {
                                          const currentContent = block.content || {}
                                          const allowedTypes = currentContent.allowedTypes || []
                                          const newTypes = allowedTypes.includes(type)
                                            ? allowedTypes.filter((t: string) => t !== type)
                                            : [...allowedTypes, type]
                                          updateBlock(selectedLesson, block.id, {
                                            content: { ...currentContent, allowedTypes: newTypes },
                                          })
                                        }}
                                      >
                                        {type}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Максимальный размер файла (MB)</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={block.content?.maxSize || 10}
                                    onChange={(e) => updateBlock(selectedLesson, block.id, {
                                      content: { ...block.content, maxSize: parseInt(e.target.value) || 10 },
                                    })}
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                      )}
                    </SortableList>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <CoursePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        course={{
          title: courseTitle,
          description: courseDescription,
          status: courseStatus,
          lessons: lessons,
        }}
      />
    </div>
  )
}

export default function CourseBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    }>
      <CourseBuilderContent />
    </Suspense>
  )
}

