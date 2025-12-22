"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, ArrowLeft, Search, Filter } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface AuditLog {
  id: number
  user_id: number
  action: string
  resource_type: string
  resource_id?: number
  details: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user_email?: string
  first_name?: string
  last_name?: string
}

export default function AuditLogsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [filters, setFilters] = useState({
    action: "all",
    resourceType: "all",
    userId: "",
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const loadLogs = async () => {
    if (!user || user.role !== 'admin') return
    
    try {
      setLoadingLogs(true)
      const params = new URLSearchParams()
      if (filters.action && filters.action !== 'all') params.append('action', filters.action)
      if (filters.resourceType && filters.resourceType !== 'all') params.append('resourceType', filters.resourceType)
      if (filters.userId) params.append('userId', filters.userId)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLogs(data.logs || [])
        }
      } else {
        toast.error("Ошибка загрузки логов")
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      toast.error("Ошибка загрузки логов")
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (user && user.role === 'admin' && !loading) {
      loadLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user, loading])

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'course.created': 'Создан курс',
      'course.updated': 'Обновлен курс',
      'course.deleted': 'Удален курс',
      'user.created': 'Создан пользователь',
      'user.updated': 'Обновлен пользователь',
      'user.deleted': 'Удален пользователь',
      'group.created': 'Создана группа',
      'group.updated': 'Обновлена группа',
      'group.deleted': 'Удалена группа',
      'course.assigned': 'Назначен курс',
      'course.completed': 'Завершен курс',
    }
    return labels[action] || action
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-bold">Аудит логи</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Панель администратора", href: "/admin/dashboard" },
            { label: "Аудит логи" },
          ]}
          className="mb-6"
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Фильтры
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Действие</Label>
                <Select
                  value={filters.action || "all"}
                  onValueChange={(value) => setFilters({ ...filters, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все действия" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все действия</SelectItem>
                    <SelectItem value="course.created">Создание курса</SelectItem>
                    <SelectItem value="course.updated">Обновление курса</SelectItem>
                    <SelectItem value="course.deleted">Удаление курса</SelectItem>
                    <SelectItem value="user.created">Создание пользователя</SelectItem>
                    <SelectItem value="user.deleted">Удаление пользователя</SelectItem>
                    <SelectItem value="group.created">Создание группы</SelectItem>
                    <SelectItem value="group.deleted">Удаление группы</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Тип ресурса</Label>
                <Select
                  value={filters.resourceType || "all"}
                  onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="course">Курс</SelectItem>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="group">Группа</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID пользователя</Label>
                <Input
                  type="number"
                  placeholder="Фильтр по пользователю"
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>История действий</CardTitle>
            <CardDescription>Логи всех действий пользователей в системе</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Логи не найдены
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Дата</th>
                      <th className="text-left p-2">Пользователь</th>
                      <th className="text-left p-2">Действие</th>
                      <th className="text-left p-2">Ресурс</th>
                      <th className="text-left p-2">IP адрес</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          {new Date(log.created_at).toLocaleString('ru-RU')}
                        </td>
                        <td className="p-2">
                          {log.first_name && log.last_name
                            ? `${log.first_name} ${log.last_name}`
                            : log.user_email || `ID: ${log.user_id}`}
                        </td>
                        <td className="p-2">
                          <span className="font-medium">{getActionLabel(log.action)}</span>
                        </td>
                        <td className="p-2">
                          {log.resource_type}
                          {log.resource_id && ` #${log.resource_id}`}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

