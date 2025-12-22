"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Award, Download, FileText, Calendar, BookOpen
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { Breadcrumbs } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"

interface Certificate {
  id: number
  number: string
  course_id: number
  course_title: string
  user_id: number
  issued_at: string
  download_url?: string
}

export default function CertificatesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/login')
      return
    }
    
    loadCertificates()
  }, [user, router, authLoading])

  async function loadCertificates() {
    try {
      setLoading(true)
      const response = await fetch(`/api/certificates/user/${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.certificates) {
          setCertificates(data.certificates)
        }
      }
    } catch (error) {
      console.error('Error loading certificates:', error)
      toast.error('Ошибка загрузки сертификатов')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (certificateNumber: string) => {
    try {
      const response = await fetch(`/api/certificates/download/${certificateNumber}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${certificateNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Сертификат скачан')
      } else {
        toast.error('Ошибка скачивания сертификата')
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast.error('Ошибка скачивания сертификата')
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
    { label: 'Сертификаты', href: '#' },
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
                <h1 className="text-xl font-bold">Мои сертификаты</h1>
                <p className="text-sm text-muted-foreground">Сертификаты о прохождении курсов</p>
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

        {certificates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">У вас пока нет сертификатов</CardTitle>
              <CardDescription className="mb-6">
                Сертификаты выдаются автоматически при завершении курсов
              </CardDescription>
              <Link href="/dashboard">
                <Button className="gradient-primary text-white">
                  Вернуться к курсам
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <Badge variant="default">Сертификат</Badge>
                  </div>
                  <CardTitle className="text-lg">{certificate.course_title}</CardTitle>
                  <CardDescription>
                    Сертификат о прохождении курса
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>№ {certificate.number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Выдан: {new Date(certificate.issued_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gradient-primary text-white"
                      onClick={() => handleDownload(certificate.number)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Скачать
                    </Button>
                    <Link href={`/course/${certificate.course_id}`}>
                      <Button variant="outline" size="icon">
                        <BookOpen className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

