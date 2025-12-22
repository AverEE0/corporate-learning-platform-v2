"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, BookOpen, TrendingUp, Award, Settings, 
  LogOut, BarChart3, Shield, UserPlus
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
// import { StatsCharts } from "@/components/admin/stats-charts" // Временно отключено из-за проблем с recharts
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, logout, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalManagers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) {
      return
    }
    
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }
    
    if (user.role !== 'admin') {
      setLoading(false)
      router.push('/dashboard')
      return
    }
    
    // Загружаем статистику для админа
    loadStats()
  }, [user, router, authLoading])

  async function loadStats() {
    try {
      setLoading(true)
      // Загружаем статистику
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats) {
          setStats(data.stats)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error loading stats:', errorData.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Error loading stats:', {
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 3),
      })
    } finally {
      setLoading(false)
    }
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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Панель администратора</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationsBell />
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
        <Breadcrumbs items={[{ label: "Панель администратора" }]} className="mb-6" />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">В системе</p>
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
                <CardTitle className="text-sm font-medium">Студенты</CardTitle>
                <UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">Зарегистрировано</p>
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
                <CardTitle className="text-sm font-medium">Менеджеры</CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalManagers}</div>
                <p className="text-xs text-muted-foreground mt-1">Активных</p>
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
                <CardTitle className="text-sm font-medium">Курсы</CardTitle>
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground mt-1">Всего создано</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Управление курсами
              </CardTitle>
              <CardDescription>Просмотр и редактирование всех курсов</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/course-builder">
                <Button className="w-full mb-2 gradient-primary text-white">
                  Создать курс
                </Button>
              </Link>
              <Link href="/manager/dashboard">
                <Button className="w-full" variant="outline">
                  Все курсы
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Управление пользователями
              </CardTitle>
              <CardDescription>Просмотр и управление всеми пользователями</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-2" 
                variant="outline"
                onClick={() => router.push('/admin/users')}
              >
                Все пользователи
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/admin/groups')}
              >
                Группы
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Настройки системы
              </CardTitle>
              <CardDescription>Конфигурация платформы</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                Перейти
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Аудит логи
              </CardTitle>
              <CardDescription>История действий пользователей</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/admin/audit-logs')}
              >
                Перейти
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats Charts */}
        {/* <StatsCharts stats={stats} /> */}
      </div>
    </div>
  )
}

