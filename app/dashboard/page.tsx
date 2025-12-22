"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, TrendingUp, Award, Play, Plus, LogOut, Menu, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { XPDisplay } from "@/components/achievements/xp-display"
import { AchievementsBadge } from "@/components/achievements/achievements-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationsBell } from "@/components/notifications/notifications-bell"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgress: 0,
    averageScore: 0,
  })
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<any[]>([])
  const [xp, setXP] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadDashboardData()
  }, [user])

  async function loadDashboardData() {
    try {
      // Загружаем достижения и XP
      try {
        const achievementsResponse = await fetch('/api/achievements?includeXP=true')
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json()
          if (achievementsData.success) {
            setAchievements(achievementsData.achievements || [])
            setXP(achievementsData.xp)
          }
        }
      } catch (error) {
        console.error('Error loading achievements:', error)
      }

      // Загружаем курсы пользователя
      const response = await fetch('/api/courses/my')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        
        // Вычисляем статистику
        const completed = data.courses?.filter((c: any) => c.progress === 100).length || 0
        const inProgress = data.courses?.filter((c: any) => c.progress > 0 && c.progress < 100).length || 0
        const avgScore = data.courses?.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / (data.courses?.length || 1) || 0
        
        setStats({
          totalCourses: data.courses?.length || 0,
          completedCourses: completed,
          inProgress: inProgress,
          averageScore: Math.round(avgScore),
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>Пожалуйста, войдите в систему для доступа к dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="gradient-primary text-white">
                Войти
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Платформа обучения</h1>
                <p className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName} ({user.role === 'student' ? 'Студент' : user.role === 'manager' ? 'Менеджер' : 'Админ'})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationsBell />
              <Link href="/achievements">
                <Button variant="ghost" size="sm">
                  <Award className="h-4 w-4 mr-2" />
                  Достижения
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Рейтинг
                </Button>
              </Link>
              <Link href="/certificates">
                <Button variant="ghost" size="sm">
                  <Award className="h-4 w-4 mr-2" />
                  Сертификаты
                </Button>
              </Link>
              {user?.role === 'manager' && (
                <Link href="/manager/dashboard">
                  <Button variant="ghost" size="sm">
                    Панель менеджера
                  </Button>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin/dashboard">
                  <Button variant="ghost" size="sm">
                    Панель админа
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* XP и Достижения */}
        {(xp || achievements.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {xp && (
              <div className="lg:col-span-2">
                <XPDisplay {...xp} />
              </div>
            )}
            {achievements.length > 0 && (
              <div>
                <Card className="gradient-card border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Достижения
                    </CardTitle>
                    <CardDescription>Ваши награды и бейджи</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                <AchievementsBadge achievements={achievements} />
                <Link href="/achievements">
                  <Button variant="outline" size="sm">
                    Все достижения
                  </Button>
                </Link>
              </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего курсов</CardTitle>
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">Доступно для изучения</p>
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
                <CardTitle className="text-sm font-medium">Завершено</CardTitle>
                <Award className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completedCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">Курсов пройдено</p>
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
                <CardTitle className="text-sm font-medium">В процессе</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground mt-1">Активных курсов</p>
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
                <div className="text-3xl font-bold">{stats.averageScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">По всем курсам</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Courses Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Мои курсы</h2>
            <Link href="/dashboard">
              <Button className="gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Найти курсы
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                Загрузка курсов...
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <p className="text-muted-foreground mb-4">У вас пока нет курсов</p>
                <Link href="/dashboard">
                  <Button className="gradient-primary text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Найти курсы
                  </Button>
                </Link>
              </div>
            ) : (
              courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === "completed" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>
                        {course.status === "completed" ? "Завершен" : "В процессе"}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <CardDescription>Продолжайте обучение</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <Link href={`/course/${course.id}`} className="w-full">
                        <Button className="w-full mt-4 gradient-primary text-white group-hover:shadow-lg transition-shadow">
                          <Play className="mr-2 h-4 w-4" />
                          {course.status === "completed" ? "Повторить" : "Продолжить"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

