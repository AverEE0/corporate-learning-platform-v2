"use client"

import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { toast } from "sonner"

interface ExportPDFButtonProps {
  type: 'courses' | 'students' | 'progress'
  courseId?: number
  startDate?: string
  endDate?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExportPDFButton({
  type,
  courseId,
  startDate,
  endDate,
  variant = "outline",
  size = "default",
}: ExportPDFButtonProps) {
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        type,
      })
      
      if (courseId) {
        params.append('courseId', courseId.toString())
      }
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/reports/export-pdf?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Ошибка экспорта')
      }

      // Получаем HTML и открываем в новом окне для печати
      const html = await response.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const windowRef = window.open(url, '_blank')
      
      if (windowRef) {
        // Даем время на загрузку, затем печатаем
        setTimeout(() => {
          windowRef.print()
        }, 500)
      }
      
      toast.success("Отчет готов к печати/сохранению в PDF")
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error("Ошибка экспорта отчета")
    }
  }

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">Экспорт PDF</span>
    </Button>
  )
}

