"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, Trophy, Star, TrendingUp, Award, 
  Lock, CheckCircle2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { XPDisplay } from "@/components/achievements/xp-display"
import { AchievementsBadge } from "@/components/achievements/achievements-badge"

export default function AchievementsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [achievements, setAchievements] = useState<any[]>([])
  const [xp, setXP] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
    
    loadData()
  }, [user, router, authLoading])

  async function loadData() {
    try {
      setLoading(true)
      const response = await fetch('/api/achievements?includeXP=true')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAchievements(data.achievements || [])
          setXP(data.xp)
        }
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
      toast.error('Ошибка загрузки достижений')
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

  if (!user) {
    return null
  }

  const breadcrumbs = [
    { label: 'Дашборд', href: '/dashboard' },
    { label: 'Достижения', href: '#' },
  ]

  const earnedAchievements = achievements.filter((a: any) => a.earned_at)
  const lockedAchievements = achievements.filter((a: any) => !a.earned_at)

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
                <h1 className="text-xl font-bold">Достижения</h1>
                <p className="text-sm text-muted-foreground">Ваши награды и прогресс</p>
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

        {/* XP Display */}
        {xp && (
          <div className="mb-8">
            <XPDisplay
              total_xp={xp.total_xp || 0}
              level={xp.level || 1}
              xp_to_next_level={xp.xp_to_next_level || 100}
              current_level_xp={(xp.total_xp || 0) - ((xp.level || 1) - 1) * 100}
            />
          </div>
        )}

        {/* Earned Achievements */}
        {earnedAchievements.length > 0 && (
          <Card className="gradient-card border-0 shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Полученные достижения ({earnedAchievements.length})
              </CardTitle>
              <CardDescription>Достижения, которые вы уже получили</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedAchievements.map((achievement: any) => (
                  <Card key={achievement.id} className="border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">{achievement.icon}</span>
                            {achievement.name}
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {achievement.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="bg-yellow-500">
                          +{achievement.points} XP
                        </Badge>
                        {achievement.earned_at && (
                          <span className="text-xs text-muted-foreground">
                            Получено: {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Доступные достижения ({lockedAchievements.length})
              </CardTitle>
              <CardDescription>Достижения, которые вы можете получить</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement: any) => (
                  <Card key={achievement.id} className="opacity-60 border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl grayscale">{achievement.icon}</span>
                        {achievement.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {achievement.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">
                        +{achievement.points} XP
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {achievements.length === 0 && !loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Достижения пока недоступны
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

