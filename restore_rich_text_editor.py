#!/usr/bin/env python3
# Скрипт для восстановления файла rich-text-editor.tsx
content = '''"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Динамический импорт для SSR с обработкой ошибок
const ReactQuill = dynamic(
  () => import("react-quill").catch(() => {
    // Fallback если react-quill не загрузился
    return { default: () => <div>Загрузка редактора...</div> }
  }),
  { 
    ssr: false,
    loading: () => <div className="min-h-[200px] border rounded-md p-4">Загрузка редактора...</div>
  }
)


interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
      },
    }),
    []
  )

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "link",
    "image",
  ]

  if (!isMounted) {
    return (
      <div className="min-h-[200px] border rounded-md p-4 bg-background">
        <textarea
          className="w-full min-h-[180px] border-0 resize-none focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Введите текст..."}
        />
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Введите текст..."}
        style={{ minHeight: "200px" }}
      />
      <style jsx global>{`
        .rich-text-editor .ql-editor {
          min-height: 200px;
        }
        .rich-text-editor .ql-container {
          font-size: 14px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
'''

with open('components/ui/rich-text-editor.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File restored successfully!")

