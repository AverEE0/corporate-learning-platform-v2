"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { DiscussionsList } from "@/components/course/discussions-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function CourseDiscussionsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const courseId = params.id ? parseInt(params.id as string) : null

  useEffect(() => {
    if (!user) {
      router.push('/')
    } else {
      setLoading(false)
    }
  }, [user, router])

  if (loading || !courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/course/${courseId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Обсуждения курса</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <DiscussionsList courseId={courseId} />
      </div>
    </div>
  )
}

