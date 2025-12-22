"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Trophy, Medal, Award, Crown, Star, TrendingUp
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"

interface LeaderboardEntry {
  id: number
  firstName: string
  lastName: string
  email: string
  total_xp: number
  level: number
  completedCourses: number
  averageScore: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
    
    loadLeaderboard()
  }, [user, router, authLoading])

  async function loadLeaderboard() {
    try {
      setLoading(true)
      // Загружаем всех пользователей и их XP для рейтинга
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        if (usersData.success && usersData.users) {
          // Получаем XP для каждого пользователя
          const leaderboardData = await Promise.all(
            usersData.users
              .filter((u: any) => u.role === 'student')
              .map(async (student: any) => {
                try {
                  const xpResponse = await fetch(`/api/achievements?userId=${student.id}&includeXP=true`)
                  if (xpResponse.ok) {
                    const xpData = await xpResponse.json()
                    const coursesResponse = await fetch(`/api/courses/my?userId=${student.id}`)
                    let completedCourses = 0
                    let totalScore = 0
                    if (coursesResponse.ok) {
                      const coursesData = await coursesResponse.json()
                      if (coursesData.success && coursesData.courses) {
                        completedCourses = coursesData.courses.filter((c: any) => c.progress === 100).length
                        const completed = coursesData.courses.filter((c: any) => c.progress === 100 && c.score !== null)
                        totalScore = completed.reduce((sum: number, c: any) => sum + (c.score || 0), 0)
                      }
                    }
                    return {
                      id: student.id,
                      firstName: student.firstName,
                      lastName: student.lastName,
                      email: student.email,
                      total_xp: xpData.xp?.total_xp || 0,
                      level: xpData.xp?.level || 1,
                      completedCourses,
                      averageScore: completedCourses > 0 ? Math.round(totalScore / completedCourses) : 0,
                    }
                  }
                } catch (error) {
                  console.error(`Error loading XP for user ${student.id}:`, error)
                }
                return {
                  id: student.id,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  email: student.email,
                  total_xp: 0,
                  level: 1,
                  completedCourses: 0,
                  averageScore: 0,
                }
              })
          )
          
          // Сортируем по XP
          leaderboardData.sort((a, b) => b.total_xp - a.total_xp)
          setLeaderboard(leaderboardData)
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      toast.error('Ошибка загрузки рейтинга')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <Trophy className="h-5 w-5 text-muted-foreground" />
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">1 место</Badge>
    if (rank === 2) return <Badge className="bg-gray-400">2 место</Badge>
    if (rank === 3) return <Badge className="bg-amber-600">3 место</Badge>
    return <Badge variant="secondary">{rank} место</Badge>
  }

  const currentUserRank = leaderboard.findIndex((entry) => entry.id === user?.id) + 1

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const breadcrumbs = [
    { label: 'Дашборд', href: '/dashboard' },
    { label: 'Рейтинг', href: '#' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Рейтинг студентов</h1>
                <p className="text-sm text-muted-foreground">Топ студентов по опыту и достижениям</p>
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

        {/* Current User Rank */}
        {currentUserRank > 0 && (
          <Card className="gradient-card border-2 border-primary mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Ваше место в рейтинге: #{currentUserRank}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {leaderboard[currentUserRank - 1]?.total_xp || 0} XP
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Уровень {leaderboard[currentUserRank - 1]?.level || 1}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="gradient-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Топ студентов</CardTitle>
            <CardDescription>Рейтинг по накопленному опыту (XP)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Рейтинг пока пуст
                </div>
              ) : (
                leaderboard.map((entry, index) => {
                  const rank = index + 1
                  const isCurrentUser = entry.id === user.id
                  
                  return (
                    <div
                      key={entry.id}
                      className={`p-4 border rounded-lg ${
                        isCurrentUser 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg">
                          {rank <= 3 ? getRankIcon(rank) : rank}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {entry.firstName} {entry.lastName}
                            </h4>
                            {isCurrentUser && (
                              <Badge variant="default">Вы</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-bold">{entry.total_xp} XP</div>
                            <div className="text-xs text-muted-foreground">
                              Уровень {entry.level}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {entry.completedCourses} курсов
                            </div>
                            {entry.averageScore > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Средний балл: {entry.averageScore}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

