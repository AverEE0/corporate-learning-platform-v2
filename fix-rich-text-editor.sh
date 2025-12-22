#!/bin/bash
cd /root/corporate-learning-platform-v2

cat > components/ui/rich-text-editor.tsx << 'RTEEOF'
"use client"

import { useState, useEffect } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Временная замена на textarea из-за несовместимости react-quill с React 18
// TODO: Заменить на совместимый WYSIWYG редактор (например, TipTap или Lexical)
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    <div className="min-h-[200px] border rounded-md p-4 bg-background">
      <textarea
        className="w-full min-h-[180px] border-0 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Введите текст..."}
      />
    </div>
  )
}
RTEEOF

echo "Fixed rich-text-editor.tsx - replaced with textarea"

