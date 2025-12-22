"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, Users, TrendingUp, Clock, Award, BarChart3, 
  Download, FileText
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportPDFButton } from "@/components/export-pdf-button"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CourseAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      router.push('/dashboard')
      return
    }
    
    if (courseId) {
      loadData()
    }
  }, [user, router, courseId, authLoading])

  async function loadData() {
    try {
      setLoading(true)
      
      // Загружаем курс
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      if (courseResponse.ok) {
        const courseData = await courseResponse.json()
        if (courseData.success) {
          setCourse(courseData.course)
        }
      }

      // Загружаем аналитику
      const analyticsResponse = await fetch(`/api/analytics/course/${courseId}`)
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        if (analyticsData.success) {
          setStats(analyticsData.stats)
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Ошибка загрузки аналитики')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
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

  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return null
  }

  const breadcrumbs = [
    { label: 'Панель менеджера', href: '/manager/dashboard' },
    { label: course?.title || 'Курс', href: `/course/${courseId}` },
    { label: 'Аналитика', href: '#' },
  ]

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
                <h1 className="text-xl font-bold">Аналитика курса</h1>
                <p className="text-sm text-muted-foreground">{course?.title || 'Загрузка...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsBell />
              <ThemeToggle />
              <ExportPDFButton
                type="progress"
                courseId={parseInt(courseId)}
                variant="outline"
                size="default"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего студентов</CardTitle>
                  <Users className="h-5 w-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_students || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Записано на курс</p>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Завершили курс</CardTitle>
                  <Award className="h-5 w-5 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.completed_students || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total_students > 0 
                      ? Math.round((stats.completed_students / stats.total_students) * 100) 
                      : 0}% от записавшихся
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.average_score || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">По всем студентам</p>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний прогресс</CardTitle>
                  <Clock className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.average_progress || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Прогресс прохождения</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Статистика прохождения</CardTitle>
                  <CardDescription>Детальная информация о прогрессе студентов</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Завершили курс</span>
                      <span className="font-medium">{stats.completed_students || 0} / {stats.total_students || 0}</span>
                    </div>
                    <Progress 
                      value={stats.total_students > 0 
                        ? (stats.completed_students / stats.total_students) * 100 
                        : 0} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>В процессе</span>
                      <span className="font-medium">
                        {(stats.total_students || 0) - (stats.completed_students || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={stats.total_students > 0 
                        ? ((stats.total_students - stats.completed_students) / stats.total_students) * 100 
                        : 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Распределение оценок</CardTitle>
                  <CardDescription>Статистика по баллам</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Отлично (90-100%)</span>
                        <span className="font-medium">{stats.excellent_count || 0}</span>
                      </div>
                      <Progress value={stats.total_students > 0 ? (stats.excellent_count / stats.total_students) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Хорошо (70-89%)</span>
                        <span className="font-medium">{stats.good_count || 0}</span>
                      </div>
                      <Progress value={stats.total_students > 0 ? (stats.good_count / stats.total_students) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Удовлетворительно (50-69%)</span>
                        <span className="font-medium">{stats.satisfactory_count || 0}</span>
                      </div>
                      <Progress value={stats.total_students > 0 ? (stats.satisfactory_count / stats.total_students) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Неудовлетворительно (&lt;50%)</span>
                        <span className="font-medium">{stats.unsatisfactory_count || 0}</span>
                      </div>
                      <Progress value={stats.total_students > 0 ? (stats.unsatisfactory_count / stats.total_students) * 100 : 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!stats && !loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Аналитика недоступна для этого курса
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

