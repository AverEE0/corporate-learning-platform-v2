#!/bin/bash
cd /root/corporate-learning-platform-v2

cat > components/ui/rich-text-editor.tsx << 'RTEEOF'
"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Undo, Redo } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    try {
      const html = editor.getHTML()
      onChange(html)
    } catch (err: any) {
      console.error('[RichTextEditor] Error:', err)
      setError(err.message || 'Update error')
    }
  }, [onChange])

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: handleUpdate,
    onCreate: () => {
      console.log('[RichTextEditor] Editor created')
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[200px] max-w-none px-4 py-3",
        "data-placeholder": placeholder || "Введите текст...",
      },
    },
  }, [handleUpdate])

  useEffect(() => {
    setIsMounted(true)
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false)
    }
  }, [value, editor])

  if (!isMounted || !editor) {
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
    <div className="border rounded-md overflow-hidden bg-background">
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs p-2 border-b">
          Ошибка: {error}
        </div>
      )}
      <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-[200px]">
        <EditorContent editor={editor} />
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror {
          outline: none;
          min-height: 200px;
          padding: 1rem;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
      `}} />
    </div>
  )
}
RTEEOF

echo "File uploaded successfully"

