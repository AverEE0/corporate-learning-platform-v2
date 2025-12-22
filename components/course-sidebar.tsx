"use client"

import { BookOpen, CheckCircle2, Circle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface Lesson {
  id: number
  title: string
  blocks: any[]
}

interface CourseSidebarProps {
  lessons: Lesson[]
  currentLessonIndex: number
  currentBlockIndex: number
  onNavigate: (lessonIndex: number, blockIndex: number) => void
  progress?: Record<number, number> // lessonId -> completion percentage
}

export function CourseSidebar({
  lessons,
  currentLessonIndex,
  currentBlockIndex,
  onNavigate,
  progress = {},
}: CourseSidebarProps) {
  const isCompleted = (lessonIndex: number) => {
    const lesson = lessons[lessonIndex]
    return lesson && progress[lesson.id] === 100
  }

  const isAccessible = (lessonIndex: number) => {
    // Первый урок всегда доступен
    if (lessonIndex === 0) return true
    // Урок доступен если предыдущий завершен
    return isCompleted(lessonIndex - 1)
  }

  return (
    <Card className="h-full p-4 overflow-y-auto">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Содержание курса
        </h3>
        
        <div className="space-y-2">
          {lessons.map((lesson, lessonIndex) => {
            const lessonProgress = progress[lesson.id] || 0
            const accessible = isAccessible(lessonIndex)
            const isCurrent = lessonIndex === currentLessonIndex

            return (
              <div key={lesson.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (accessible) {
                      onNavigate(lessonIndex, 0)
                    }
                  }}
                  disabled={!accessible}
                  className={cn(
                    "w-full text-left p-2 rounded-md transition-colors flex items-center justify-between gap-2",
                    isCurrent && "bg-primary/10 border border-primary/20",
                    accessible
                      ? "hover:bg-accent cursor-pointer"
                      : "opacity-50 cursor-not-allowed",
                    !accessible && "pointer-events-none"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isCompleted(lessonIndex) ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    ) : accessible ? (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {lessonIndex + 1}. {lesson.title}
                    </span>
                  </div>
                  {lessonProgress > 0 && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {Math.round(lessonProgress)}%
                    </span>
                  )}
                </button>

                {/* Блоки урока (показываем только для текущего урока) */}
                {isCurrent && lesson.blocks && lesson.blocks.length > 0 && (
                  <div className="ml-6 space-y-1 border-l-2 border-muted pl-2">
                    {lesson.blocks.map((block, blockIndex) => {
                      const isCurrentBlock =
                        lessonIndex === currentLessonIndex &&
                        blockIndex === currentBlockIndex

                      return (
                        <button
                          key={block.id}
                          onClick={() => onNavigate(lessonIndex, blockIndex)}
                          className={cn(
                            "w-full text-left p-1.5 rounded text-xs transition-colors",
                            isCurrentBlock
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-accent/50 text-muted-foreground"
                          )}
                        >
                          {blockIndex + 1}. {block.title || "Блок " + (blockIndex + 1)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

