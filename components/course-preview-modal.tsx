"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Eye, X } from "lucide-react"
import { CourseSidebar } from "@/components/course-sidebar"

interface Lesson {
  id: string | number
  title: string
  description: string
  blocks: Block[]
}

interface Block {
  id: string | number
  type: string
  title: string
  content: any
}

interface CoursePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: {
    title: string
    description: string
    status: string
    lessons: Lesson[]
  }
  onPublish?: () => void
}

export function CoursePreviewModal({
  open,
  onOpenChange,
  course,
  onPublish,
}: CoursePreviewModalProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)

  const currentLesson = course.lessons[currentLessonIndex]
  const currentBlock = currentLesson?.blocks[currentBlockIndex]

  if (!course || !course.lessons || course.lessons.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Eye className="h-6 w-6" />
                Предпросмотр курса
              </DialogTitle>
              <DialogDescription className="mt-2">
                {course.title}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {course.status === 'published' ? 'Опубликован' : 'Черновик'}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-80 border-r overflow-y-auto p-4">
            <CourseSidebar
              lessons={course.lessons.map((l, idx) => ({
                id: typeof l.id === 'number' ? l.id : idx,
                title: l.title,
                blocks: l.blocks || [],
              }))}
              currentLessonIndex={currentLessonIndex}
              currentBlockIndex={currentBlockIndex}
              onNavigate={(lessonIndex, blockIndex) => {
                setCurrentLessonIndex(lessonIndex)
                setCurrentBlockIndex(blockIndex)
              }}
              progress={{}}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentLesson && (
              <div className="space-y-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {currentLesson.title}
                  </h2>
                  {currentLesson.description && (
                    <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                  )}
                </div>
              </div>
            )}

            {currentBlock && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <Badge variant="outline" className="mb-2">
                    {currentBlock.type}
                  </Badge>
                  <h3 className="font-semibold text-lg mb-2">{currentBlock.title}</h3>
                  {currentBlock.type === 'text' && currentBlock.content?.text && (
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentBlock.content.text }}
                    />
                  )}
                  {currentBlock.type === 'video' && currentBlock.content?.url && (
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                      Видео: {currentBlock.content.url}
                    </div>
                  )}
                  {currentBlock.type === 'quiz' && (
                    <div className="space-y-2">
                      <p className="font-medium">{currentBlock.content?.question}</p>
                      {currentBlock.content?.answers?.map((answer: any, idx: number) => (
                        <div key={idx} className="p-2 border rounded">
                          {answer.text} {answer.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="outline"
                disabled={currentLessonIndex === 0 && currentBlockIndex === 0}
                onClick={() => {
                  if (currentBlockIndex > 0) {
                    setCurrentBlockIndex(currentBlockIndex - 1)
                  } else if (currentLessonIndex > 0) {
                    setCurrentLessonIndex(currentLessonIndex - 1)
                    setCurrentBlockIndex(
                      course.lessons[currentLessonIndex - 1]?.blocks.length - 1 || 0
                    )
                  }
                }}
              >
                Назад
              </Button>
              <Button
                onClick={() => {
                  if (
                    currentBlockIndex < (currentLesson?.blocks.length || 0) - 1
                  ) {
                    setCurrentBlockIndex(currentBlockIndex + 1)
                  } else if (currentLessonIndex < course.lessons.length - 1) {
                    setCurrentLessonIndex(currentLessonIndex + 1)
                    setCurrentBlockIndex(0)
                  }
                }}
                disabled={
                  currentLessonIndex === course.lessons.length - 1 &&
                  currentBlockIndex === (currentLesson?.blocks.length || 0) - 1
                }
              >
                Далее
              </Button>
            </div>
          </div>
        </div>

        {onPublish && course.status === 'draft' && (
          <div className="p-6 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
            <Button onClick={onPublish} className="gradient-primary text-white">
              Опубликовать курс
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

