"use client"

import { BookOpen, CheckCircle2, Circle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

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
  completedBlocks?: Record<string | number, any> // blockId -> answer (для определения пройденных блоков)
}

export function CourseSidebar({
  lessons,
  currentLessonIndex,
  currentBlockIndex,
  onNavigate,
  progress = {},
  completedBlocks = {},
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

  const isBlockCompleted = (blockId: string | number) => {
    const answer = completedBlocks[blockId]
    return answer !== undefined && answer !== null && answer !== ""
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
                    <AnimatePresence mode="wait">
                      {isCompleted(lessonIndex) ? (
                        <motion.div
                          key="completed"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        </motion.div>
                      ) : accessible ? (
                        <motion.div
                          key="accessible"
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </motion.div>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </AnimatePresence>
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
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-6 space-y-1 border-l-2 border-muted pl-2"
                  >
                    {lesson.blocks.map((block, blockIndex) => {
                      const isCurrentBlock =
                        lessonIndex === currentLessonIndex &&
                        blockIndex === currentBlockIndex
                      const blockCompleted = isBlockCompleted(block.id)

                      return (
                        <motion.button
                          key={block.id}
                          onClick={() => onNavigate(lessonIndex, blockIndex)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: blockIndex * 0.05 }}
                          className={cn(
                            "w-full text-left p-1.5 rounded text-xs transition-colors flex items-center gap-2",
                            isCurrentBlock
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-accent/50 text-muted-foreground"
                          )}
                        >
                          <AnimatePresence mode="wait">
                            {blockCompleted ? (
                              <motion.div
                                key="block-completed"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="block-incomplete"
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Circle className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className="truncate">
                            {blockIndex + 1}. {block.title || "Блок " + (blockIndex + 1)}
                          </span>
                        </motion.button>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

