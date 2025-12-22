"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import { toast } from "sonner"

interface FileUploadBlockProps {
  allowedTypes: string[]
  maxSize: number // MB
  onFileUpload: (fileUrl: string) => void
  uploadedFile?: string
}

export function FileUploadBlock({
  allowedTypes,
  maxSize,
  onFileUpload,
  uploadedFile,
}: FileUploadBlockProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка размера
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Файл слишком большой. Максимальный размер: ${maxSize}MB`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "document")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const fileUrl = result.url || result.file?.url
        onFileUpload(fileUrl)
        toast.success("Файл загружен успешно")
      } else {
        toast.error("Ошибка загрузки файла")
      }
    } catch (error) {
      toast.error("Ошибка загрузки файла")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {uploadedFile ? (
        <div className="p-4 border rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Файл загружен</p>
              <a
                href={uploadedFile.startsWith('/') || uploadedFile.startsWith('http') 
                  ? uploadedFile 
                  : `/api/files/${uploadedFile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Открыть файл
              </a>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onFileUpload("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            accept={allowedTypes.map(t => 
              t === "document" ? ".doc,.docx,.txt" : 
              t === "image" ? "image/*" : 
              t === "pdf" ? ".pdf" : "*"
            ).join(",")}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium mb-2">
              {uploading ? "Загрузка..." : "Нажмите для выбора файла"}
            </p>
            <p className="text-sm text-muted-foreground">
              Разрешенные типы: {allowedTypes.join(", ")} • Макс. размер: {maxSize}MB
            </p>
          </div>
        </label>
      )}
    </div>
  )
}

