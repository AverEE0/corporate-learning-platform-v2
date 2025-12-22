#!/bin/bash
cd /root/corporate-learning-platform-v2

# Исправляем rich-text-editor.tsx - правильные зависимости для useEditor
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
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[RichTextEditor] Component mounted, value:', value?.substring(0, 50))
    return () => {
      console.log('[RichTextEditor] Component unmounting')
    }
  }, [])

  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    try {
      const html = editor.getHTML()
      console.log('[RichTextEditor] Content updated:', html.substring(0, 100))
      onChange(html)
    } catch (err: any) {
      console.error('[RichTextEditor] Error in handleUpdate:', err)
      setError(err.message || 'Update error')
    }
  }, [onChange])

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: handleUpdate,
    onCreate: ({ editor }) => {
      console.log('[RichTextEditor] Editor created successfully')
      setInitError(null)
    },
    onDestroy: () => {
      console.log('[RichTextEditor] Editor destroyed')
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[200px] max-w-none px-4 py-3",
        "data-placeholder": placeholder || "Введите текст...",
      },
    },
    onError: ({ error }) => {
      console.error('[RichTextEditor] Editor error:', error)
      setInitError(error.message || 'Editor initialization error')
    },
  }, [handleUpdate])

  useEffect(() => {
    console.log('[RichTextEditor] Setting mounted state')
    setIsMounted(true)
    return () => {
      console.log('[RichTextEditor] Cleanup: destroying editor')
      if (editor) {
        try {
          editor.destroy()
        } catch (err: any) {
          console.error('[RichTextEditor] Error destroying editor:', err)
        }
      }
    }
  }, [editor])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      try {
        console.log('[RichTextEditor] Syncing value to editor')
        editor.commands.setContent(value || "", false)
      } catch (err: any) {
        console.error('[RichTextEditor] Error setting content:', err)
        setError(err.message || 'Content sync error')
      }
    }
  }, [value, editor])

  if (!isMounted) {
    console.log('[RichTextEditor] Not mounted yet, showing textarea fallback')
    return (
      <div className="min-h-[200px] border rounded-md p-4 bg-background">
        <textarea
          className="w-full min-h-[180px] border-0 resize-none focus:outline-none"
          value={value}
          onChange={(e) => {
            console.log('[RichTextEditor] Textarea onChange:', e.target.value.substring(0, 50))
            onChange(e.target.value)
          }}
          placeholder={placeholder || "Введите текст..."}
        />
      </div>
    )
  }

  if (!editor) {
    console.warn('[RichTextEditor] Editor not initialized yet')
    if (initError) {
      console.error('[RichTextEditor] Init error:', initError)
      return (
        <div className="min-h-[200px] border rounded-md p-4 bg-background border-destructive">
          <p className="text-sm text-destructive mb-2">Ошибка загрузки редактора: {initError}</p>
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
        <p className="text-sm text-muted-foreground mb-2">Загрузка редактора...</p>
        <textarea
          className="w-full min-h-[180px] border-0 resize-none focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Введите текст..."}
        />
      </div>
    )
  }

  if (error) {
    console.error('[RichTextEditor] Render error:', error)
  }

  const handleToolbarClick = useCallback((action: () => void, actionName: string) => {
    try {
      console.log(`[RichTextEditor] Toolbar action: ${actionName}`)
      action()
    } catch (err: any) {
      console.error(`[RichTextEditor] Error in toolbar action ${actionName}:`, err)
      setError(err.message || `${actionName} error`)
    }
  }, [])

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs p-2 border-b">
          Ошибка: {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Скрыть
          </button>
        </div>
      )}
      <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleBold().run(), "bold")}
          aria-label="Жирный"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleItalic().run(), "italic")}
          aria-label="Курсив"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), "h1")}
          aria-label="Заголовок 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), "h2")}
          aria-label="Заголовок 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), "h3")}
          aria-label="Заголовок 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleBulletList().run(), "bulletList")}
          aria-label="Маркированный список"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleOrderedList().run(), "orderedList")}
          aria-label="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().undo().run(), "undo")}
          disabled={!editor.can().undo()}
          aria-label="Отменить"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().redo().run(), "redo")}
          disabled={!editor.can().redo()}
          aria-label="Повторить"
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
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror strong {
          font-weight: bold;
        }
        .ProseMirror em {
          font-style: italic;
        }
      `}} />
    </div>
  )
}
RTEEOF

# Исправляем auth-context.tsx - правильные зависимости для useMemo
cat > lib/auth-context.tsx << 'AUTHCTXEOF'
"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'student'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    
    async function checkAuth() {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/auth/me', {
          signal: controller.signal,
          credentials: 'include'
        })
        
        clearTimeout(timeoutId)
        
        if (!mounted) return
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && mounted) {
          console.error('Auth check failed:', error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка входа')
    }

    setUser(data.user)
    
    if (data.user.role === 'admin') {
      window.location.replace('/admin/dashboard')
    } else if (data.user.role === 'manager') {
      window.location.replace('/manager/dashboard')
    } else {
      window.location.replace('/dashboard')
    }
  }, [])

  const register = useCallback(async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Ошибка регистрации')
    }

    setUser(result.user)
    
    if (result.user.role === 'admin') {
      window.location.replace('/admin/dashboard')
    } else if (result.user.role === 'manager') {
      window.location.replace('/manager/dashboard')
    } else {
      window.location.replace('/dashboard')
    }
  }, [])

  const logout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }, [router])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout
  }), [user, loading, login, register, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
AUTHCTXEOF

echo "Files fixed"

