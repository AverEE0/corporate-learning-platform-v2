"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, BookOpen, Users, Calendar, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AssignCoursePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [dueDate, setDueDate] = useState<string>("")
  const [maxAttempts, setMaxAttempts] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      router.push('/dashboard')
      return
    }

    // Получаем courseId из URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const courseId = params.get('courseId')
      if (courseId) {
        setSelectedCourse(courseId)
      }
    }

    loadData()
  }, [user, router, authLoading])

  async function loadData() {
    try {
      // Загружаем курсы
      const coursesResponse = await fetch('/api/manager/courses')
      if (coursesResponse.ok) {
        const data = await coursesResponse.json()
        if (data.success) {
          setCourses(Array.isArray(data.courses) ? data.courses : [])
        }
      }

      // Загружаем студентов
      const studentsResponse = await fetch('/api/manager/students')
      if (studentsResponse.ok) {
        const data = await studentsResponse.json()
        if (data.success) {
          setStudents(Array.isArray(data.students) ? data.students : [])
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((s: any) => s.id))
    }
  }

  async function handleAssign() {
    if (!selectedCourse) {
      toast.error('Выберите курс')
      return
    }

    if (selectedStudents.length === 0) {
      toast.error('Выберите хотя бы одного студента')
      return
    }

    setAssigning(true)
    try {
      const response = await fetch('/api/courses/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: parseInt(selectedCourse),
          userIds: selectedStudents,
          dueDate: dueDate || null,
          maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`Курс назначен ${selectedStudents.length} студентам`)
        router.push('/manager/dashboard')
      } else {
        toast.error(data.error || 'Ошибка назначения курса')
      }
    } catch (error) {
      console.error('Error assigning course:', error)
      toast.error('Ошибка назначения курса')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
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
                <h1 className="text-xl font-bold">Назначить курс</h1>
                <p className="text-sm text-muted-foreground">
                  Выберите курс и студентов для назначения
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Выбор курса */}
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Выбор курса
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Курс</Label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800"
                >
                  <option value="">Выберите курс</option>
                  {courses.map((course: any) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Дедлайн (опционально)</Label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Максимум попыток (опционально)</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                  placeholder="Не ограничено"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Выбор студентов */}
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Выбор студентов
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllStudents}
                >
                  {selectedStudents.length === students.length ? 'Снять все' : 'Выбрать все'}
                </Button>
              </div>
              <CardDescription>
                Выбрано: {selectedStudents.length} из {students.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {students.map((student: any) => (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.includes(student.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      {selectedStudents.includes(student.id) && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link href="/manager/dashboard">
            <Button variant="outline">Отмена</Button>
          </Link>
          <Button
            onClick={handleAssign}
            disabled={assigning || !selectedCourse || selectedStudents.length === 0}
            className="gradient-primary text-white"
          >
            {assigning ? 'Назначается...' : 'Назначить курс'}
          </Button>
        </div>
      </div>
    </div>
  )
}

