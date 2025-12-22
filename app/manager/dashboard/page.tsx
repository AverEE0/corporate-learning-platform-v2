"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, BookOpen, TrendingUp, Award, Plus, 
  Eye, Edit, LogOut, BarChart3, Clock, Download, MessageSquare, Trash2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchInput } from "@/components/ui/search-input"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ManagerDashboardPage() {
  const router = useRouter()
  const { user, logout, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (authLoading) {
      return
    }
    
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }
    
    if (user.role !== 'manager' && user.role !== 'admin') {
      setLoading(false)
      router.push('/dashboard')
      return
    }
    
    loadData()
  }, [user, router, authLoading])

  async function loadData() {
    try {
      // Загружаем курсы менеджера
      const coursesResponse = await fetch('/api/manager/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        if (coursesData.success && coursesData.courses) {
          setCourses(Array.isArray(coursesData.courses) ? coursesData.courses : [])
        }
      } else {
        const errorData = await coursesResponse.json().catch(() => ({}))
        console.error('Error loading courses:', errorData.error || 'Unknown error')
      }

      // Загружаем студентов
      const studentsResponse = await fetch('/api/manager/students')
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        if (studentsData.success && studentsData.students) {
          setStudents(Array.isArray(studentsData.students) ? studentsData.students : [])
        }
      } else {
        const errorData = await studentsResponse.json().catch(() => ({}))
        console.error('Error loading students:', errorData.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Error loading data:', {
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 3),
      })
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация курсов и студентов по поисковому запросу
  const filteredCourses = courses.filter((course: any) =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStudents = students.filter((student: any) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteCourse = async (courseId: number, courseTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить курс "${courseTitle}"? Это действие нельзя отменить.`)) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Курс успешно удален')
        // Обновляем список курсов
        loadData()
      } else {
        toast.error(data.error || 'Ошибка удаления курса')
      }
    } catch (error: any) {
      console.error('Error deleting course:', error)
      toast.error('Ошибка удаления курса')
    }
  }

  const stats = {
    totalStudents: students.length,
    activeCourses: courses.filter((c: any) => c.status === 'published').length,
    totalCourses: courses.length,
    avgScore: students.length > 0
      ? Math.round(students.reduce((sum: number, s: any) => sum + (s.averageScore || 0), 0) / students.length)
      : 0,
  }

  if (authLoading || (loading && !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-12 w-64" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Редирект обработается через useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Панель менеджера</h1>
                <p className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Дашборд
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/course-builder">
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5" />
                  Создать курс
                </CardTitle>
                <CardDescription>Создать новый курс обучения</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/manager/groups">
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Группы студентов
                </CardTitle>
                <CardDescription>Управление группами студентов</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/manager/assign-course">
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full hover:scale-105">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  Назначить курс
                </CardTitle>
                <CardDescription>Назначить курс студентам</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card 
            className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full hover:scale-105"
            onClick={() => {
              if (courses.length === 0) {
                toast.info('Сначала создайте курс, чтобы просмотреть аналитику')
                return
              }
              // Показываем список курсов для выбора аналитики
              const courseId = courses[0].id
              router.push(`/manager/analytics/course/${courseId}`)
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Аналитика курсов
              </CardTitle>
              <CardDescription>Статистика и отчеты по курсам</CardDescription>
            </CardHeader>
          </Card>
        </div>
        {/* Search */}
        <div className="mb-6">
          <SearchInput
            placeholder="Поиск по курсам и студентам..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            className="max-w-md"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего студентов</CardTitle>
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">Зарегистрированных</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Активные курсы</CardTitle>
                <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">Опубликованных</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего курсов</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">Созданных</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">По всем курсам</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Courses */}
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Мои курсы</CardTitle>
                <CardDescription>Управление курсами</CardDescription>
              </div>
              <Link href="/course-builder">
                <Button size="sm" className="gradient-primary text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Загрузка...
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Нет созданных курсов</p>
                  <Link href="/course-builder">
                    <Button className="gradient-primary text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Создать первый курс
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredCourses.map((course: any, index: number) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{course.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {course.description || "Без описания"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{course.lesson_count || 0} уроков</span>
                          <span>{course.enrolled_students || 0} студентов</span>
                          <Badge
                            variant={course.status === 'published' ? 'default' : 'secondary'}
                          >
                            {course.status === 'published' ? 'Опубликован' : 'Черновик'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/manager/analytics/course/${course.id}`)}
                          title="Аналитика курса"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/course/${course.id}`)}
                          title="Просмотреть курс"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/course-builder?courseId=${course.id}`)}
                          title="Редактировать курс"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteCourse(course.id, course.title)
                          }}
                          title="Удалить курс"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => router.push(`/course/${course.id}/discussions`)}
                          title="Обсуждения курса"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <ExportPDFButton
                          type="progress"
                          courseId={course.id}
                          variant="ghost"
                          size="icon"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/analytics/export/course/${course.id}?format=excel`)
                              if (response.ok) {
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `course-${course.id}-report.xls`
                                document.body.appendChild(a)
                                a.click()
                                window.URL.revokeObjectURL(url)
                                document.body.removeChild(a)
                                toast.success("Отчет экспортирован")
                              } else {
                                toast.error("Ошибка экспорта отчета")
                              }
                            } catch (error) {
                              console.error('Export error:', error)
                              toast.error("Ошибка экспорта отчета")
                            }
                          }}
                          title="Экспорт отчета (Excel)"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Students */}
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Студенты</CardTitle>
              <CardDescription>Список всех студентов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-5 w-64 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </Card>
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? "Студенты не найдены" : "Нет зарегистрированных студентов"}
                  </p>
                </div>
              ) : (
                filteredStudents.map((student: any, index: number) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link 
                        href={`/manager/students/${student.id}`}
                        className="flex-1 hover:underline"
                      >
                        <h4 className="font-semibold">
                          {student.firstName} {student.lastName}
                        </h4>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span>{student.assignedCourses || 0} назначено</span>
                      <span>{student.enrolledCourses || 0} записано</span>
                      <div className="flex items-center gap-1" title="Последняя активность">
                        <Clock className="h-3 w-3" />
                        {student.lastActivity 
                          ? new Date(student.lastActivity).toLocaleString('ru-RU', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Никогда'}
                      </div>
                      {student.lastLogin && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Последний вход">
                          <span>Вход: {new Date(student.lastLogin).toLocaleString('ru-RU', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Средний балл</span>
                        <span className="font-medium">{student.averageScore || 0}%</span>
                      </div>
                      <Progress value={student.averageScore || 0} className="h-2" />
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

