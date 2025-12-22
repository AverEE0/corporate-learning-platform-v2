"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, User, Mail, Calendar, BookOpen, Award, 
  TrendingUp, Clock, Download
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { ExportPDFButton } from "@/components/export-pdf-button"

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params?.id as string
  const { user, loading: authLoading } = useAuth()
  const [student, setStudent] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      router.push('/dashboard')
      return
    }
    
    if (studentId) {
      loadData()
    }
  }, [user, router, studentId, authLoading])

  async function loadData() {
    try {
      setLoading(true)
      
      // Загружаем студента
      const studentResponse = await fetch(`/api/users`)
      if (studentResponse.ok) {
        const usersData = await studentResponse.json()
        if (usersData.success && usersData.users) {
          const found = usersData.users.find((u: any) => u.id === parseInt(studentId))
          if (found) {
            setStudent(found)
          }
        }
      }

      // Загружаем курсы студента
      const coursesResponse = await fetch(`/api/courses/my?userId=${studentId}`)
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        if (coursesData.success && coursesData.courses) {
          setCourses(coursesData.courses || [])
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Ошибка загрузки данных студента')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return null
  }

  const breadcrumbs = [
    { label: 'Панель менеджера', href: '/manager/dashboard' },
    { label: 'Студенты', href: '/manager/dashboard' },
    { label: student ? `${student.firstName} ${student.lastName}` : 'Студент', href: '#' },
  ]

  const stats = {
    totalCourses: courses.length,
    completedCourses: courses.filter((c: any) => c.progress === 100).length,
    inProgress: courses.filter((c: any) => c.progress > 0 && c.progress < 100).length,
    averageScore: courses.length > 0
      ? Math.round(courses.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / courses.length)
      : 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/manager/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Детали студента</h1>
                <p className="text-sm text-muted-foreground">
                  {student ? `${student.firstName} ${student.lastName}` : 'Загрузка...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {student && (
          <>
            {/* Student Info */}
            <Card className="gradient-card border-0 shadow-lg mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {student.firstName} {student.lastName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4" />
                        {student.email}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">{student.role === 'student' ? 'Студент' : student.role}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего курсов</CardTitle>
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCourses}</div>
                  <p className="text-xs text-muted-foreground mt-1">Назначено курсов</p>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Завершено</CardTitle>
                  <Award className="h-5 w-5 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.completedCourses}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.totalCourses > 0 
                      ? Math.round((stats.completedCourses / stats.totalCourses) * 100) 
                      : 0}% от всех курсов
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">В процессе</CardTitle>
                  <Clock className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.inProgress}</div>
                  <p className="text-xs text-muted-foreground mt-1">Активно проходит</p>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.averageScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1">По всем курсам</p>
                </CardContent>
              </Card>
            </div>

            {/* Courses List */}
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Курсы студента</CardTitle>
                <CardDescription>Список всех назначенных курсов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Студент не записан ни на один курс
                  </div>
                ) : (
                  courses.map((course: any) => (
                    <div
                      key={course.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{course.title}</h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Прогресс</span>
                                <span className="font-medium">{course.progress || 0}%</span>
                              </div>
                              <Progress value={course.progress || 0} className="h-2" />
                            </div>
                            {course.score !== null && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Балл: <strong className="text-foreground">{course.score}%</strong></span>
                                <Badge variant={course.progress === 100 ? 'default' : 'secondary'}>
                                  {course.progress === 100 ? 'Завершен' : 'В процессе'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/course/${course.id}`)}
                          >
                            Просмотреть
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!student && !loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Студент не найден
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

