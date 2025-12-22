"use client"

import { useState, useEffect, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ImageExtension from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import LinkExtension from "@tiptap/extension-link"
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Undo, Redo, Image as ImageIcon, Video, Underline as UnderlineIcon, Strikethrough, Link, Quote, Code, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
  onVideoUpload?: (file: File) => Promise<string>
}

export function RichTextEditor({ value, onChange, placeholder, onImageUpload, onVideoUpload }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [urlDialogType, setUrlDialogType] = useState<'image' | 'video' | 'link'>('image')
  const [urlInput, setUrlInput] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('[RichTextEditor] Component mounted, value:', value?.substring(0, 50))
    return () => {
      console.log('[RichTextEditor] Component unmounting')
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      try {
        const html = editor.getHTML()
        console.log('[RichTextEditor] Content updated:', html.substring(0, 100))
        onChange(html)
      } catch (err: any) {
        console.error('[RichTextEditor] Error in handleUpdate:', err)
        setError(err.message || 'Update error')
      }
    },
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
  })

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
    if (editor && value !== undefined && value !== null) {
      const currentHtml = editor.getHTML()
      // Избегаем бесконечного цикла - обновляем только если контент действительно изменился
      if (value !== currentHtml && value.trim() !== currentHtml.trim()) {
        try {
          console.log('[RichTextEditor] Syncing value to editor')
          editor.commands.setContent(value || "", false)
        } catch (err: any) {
          console.error('[RichTextEditor] Error setting content:', err)
          setError(err.message || 'Content sync error')
        }
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

  const handleToolbarClick = (action: () => void, actionName: string) => {
    try {
      console.log(`[RichTextEditor] Toolbar action: ${actionName}`)
      action()
    } catch (err: any) {
      console.error(`[RichTextEditor] Error in toolbar action ${actionName}:`, err)
      setError(err.message || `${actionName} error`)
    }
  }

  const handleUrlInsert = () => {
    if (!editor || !urlInput.trim()) return
    
    const url = urlInput.trim()
    
    if (urlDialogType === 'link') {
      try {
        // Если есть выделенный текст, применяем ссылку к нему, иначе вставляем URL как текст со ссылкой
        if (editor.state.selection.empty) {
          editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
        } else {
          editor.chain().focus().setLink({ href: url }).run()
        }
        setTimeout(() => {
          const html = editor.getHTML()
          onChange(html)
        }, 100)
        setUrlDialogOpen(false)
        setUrlInput('')
        toast.success('Ссылка вставлена')
      } catch (error) {
        console.error('Ошибка вставки ссылки:', error)
        toast.error('Ошибка вставки ссылки')
      }
    } else if (urlDialogType === 'image') {
      try {
        editor.chain().focus().setImage({ src: url, alt: 'Изображение' }).run()
        // Явно обновляем контент после вставки изображения
        setTimeout(() => {
          const html = editor.getHTML()
          console.log('HTML после вставки изображения по URL:', html.substring(0, 200))
          onChange(html)
        }, 100)
        setUrlDialogOpen(false)
        setUrlInput('')
        toast.success('Изображение вставлено')
      } catch (error) {
        console.error('Ошибка вставки изображения:', error)
        toast.error('Ошибка вставки изображения')
      }
    } else {
      let videoHtml = ''
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let embedUrl = url
        if (url.includes('youtube.com/watch?v=')) {
          embedUrl = url.replace('youtube.com/watch?v=', 'youtube.com/embed/').split('&')[0]
        } else if (url.includes('youtu.be/')) {
          embedUrl = url.replace('youtu.be/', 'youtube.com/embed/')
        }
        videoHtml = `<iframe src="${embedUrl}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></iframe>`
      } else if (url.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
        if (videoId) {
          videoHtml = `<iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></iframe>`
        }
      } else {
        videoHtml = `<video src="${url}" controls style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></video>`
      }
      
      if (videoHtml) {
        try {
          editor.chain().focus().insertContent(videoHtml, {
            parseOptions: {
              preserveWhitespace: 'full'
            }
          }).run()
          // Явно обновляем контент после вставки видео
          setTimeout(() => {
            const html = editor.getHTML()
            console.log('HTML после вставки видео по URL:', html.substring(0, 200))
            onChange(html)
          }, 100)
          setUrlDialogOpen(false)
          setUrlInput('')
          toast.success('Видео вставлено')
        } catch (error) {
          console.error('Ошибка вставки видео:', error)
          toast.error('Ошибка вставки видео')
        }
      } else {
        toast.error('Не удалось создать видео из URL')
      }
    }
  }

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
      <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50 overflow-x-auto">
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
        <Button
          type="button"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleUnderline().run(), "underline")}
          aria-label="Подчеркивание"
          title="Подчеркивание"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleStrike().run(), "strike")}
          aria-label="Зачеркивание"
          title="Зачеркивание"
        >
          <Strikethrough className="h-4 w-4" />
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
          variant={editor.isActive("link") ? "default" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run()
            } else {
              const currentUrl = editor.getAttributes('link').href || ''
              setUrlDialogType('link')
              setUrlInput(currentUrl)
              setTimeout(() => {
                setUrlDialogOpen(true)
              }, 0)
            }
          }}
          aria-label="Ссылка"
          title="Вставить ссылку"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleBlockquote().run(), "blockquote")}
          aria-label="Цитата"
          title="Цитата"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().toggleCode().run(), "code")}
          aria-label="Код"
          title="Код"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleToolbarClick(() => editor.chain().focus().setHorizontalRule().run(), "horizontalRule")}
          aria-label="Горизонтальная линия"
          title="Горизонтальная линия"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Кнопка "Изображение" нажата, editor:', !!editor)
            if (!editor) {
              console.error('Editor не инициализирован')
              return
            }
            console.log('Открываем диалог для изображения')
            setUrlDialogType('image')
            setUrlInput('')
            // Используем setTimeout чтобы убедиться, что состояние обновится
            setTimeout(() => {
              setUrlDialogOpen(true)
              console.log('urlDialogOpen установлен в true')
            }, 0)
          }}
          title="Вставить изображение по URL"
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          <span className="text-xs">Изображение</span>
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={imageInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file || !editor) return
            
            console.log('Загрузка изображения:', file.name)
            
            if (onImageUpload) {
              try {
                console.log('Вызов onImageUpload...')
                const url = await onImageUpload(file)
                console.log('Изображение загружено, URL:', url)
                // Используем команду setImage для правильной вставки изображения
                editor.chain().focus().setImage({ src: url, alt: 'Изображение' }).run()
                // Явно обновляем контент после вставки изображения
                setTimeout(() => {
                  const html = editor.getHTML()
                  console.log('HTML после вставки изображения:', html.substring(0, 200))
                  onChange(html)
                }, 100)
                // Сброс input для возможности повторной загрузки того же файла
                e.target.value = ''
              } catch (error) {
                console.error('Ошибка загрузки изображения:', error)
                toast.error('Ошибка загрузки изображения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
              }
            } else {
              // Если нет функции загрузки, используем data URL
              console.log('Использование data URL для изображения')
              const reader = new FileReader()
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string
                editor.chain().focus().setImage({ src: dataUrl, alt: 'Изображение' }).run()
                setTimeout(() => {
                  const html = editor.getHTML()
                  onChange(html)
                }, 100)
              }
              reader.onerror = () => {
                console.error('Ошибка чтения файла')
                toast.error('Ошибка чтения файла изображения')
              }
              reader.readAsDataURL(file)
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Загрузить изображение с компьютера"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Кнопка "Загрузить изображение" нажата')
            if (imageInputRef.current) {
              imageInputRef.current.click()
            } else {
              console.error('imageInputRef.current не найден')
            }
          }}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          <span className="text-xs">Загрузить</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Кнопка "Видео" нажата, editor:', !!editor)
            if (!editor) {
              console.error('Editor не инициализирован')
              return
            }
            console.log('Открываем диалог для видео')
            setUrlDialogType('video')
            setUrlInput('')
            // Используем setTimeout чтобы убедиться, что состояние обновится
            setTimeout(() => {
              setUrlDialogOpen(true)
              console.log('urlDialogOpen установлен в true')
            }, 0)
          }}
          title="Вставить видео по URL"
        >
          <Video className="h-4 w-4 mr-1" />
          <span className="text-xs">Видео</span>
        </Button>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={videoInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file || !editor) return
            
            console.log('Загрузка видео:', file.name)
            
            if (onVideoUpload) {
              try {
                console.log('Вызов onVideoUpload...')
                const url = await onVideoUpload(file)
                console.log('Видео загружено, URL:', url)
                editor.chain().focus().insertContent(`<video src="${url}" controls style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></video>`, {
                  parseOptions: {
                    preserveWhitespace: 'full'
                  }
                }).run()
                // Явно обновляем контент после вставки видео
                setTimeout(() => {
                  const html = editor.getHTML()
                  console.log('HTML после вставки видео:', html.substring(0, 200))
                  onChange(html)
                }, 100)
                // Сброс input для возможности повторной загрузки того же файла
                e.target.value = ''
              } catch (error) {
                console.error('Ошибка загрузки видео:', error)
                toast.error('Ошибка загрузки видео: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
              }
            } else {
              // Если нет функции загрузки, используем data URL (для небольших файлов)
              console.log('Использование data URL для видео')
              const reader = new FileReader()
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string
                const videoHtml = `<video src="${dataUrl}" controls style="max-width: 100%; border-radius: 8px; margin: 16px 0;"></video>`
                editor.chain().focus().insertContent(videoHtml).run()
                setTimeout(() => {
                  const html = editor.getHTML()
                  onChange(html)
                }, 100)
              }
              reader.onerror = () => {
                console.error('Ошибка чтения файла')
                toast.error('Ошибка чтения файла видео')
              }
              reader.readAsDataURL(file)
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Загрузить видео с компьютера"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Кнопка "Загрузить видео" нажата')
            if (videoInputRef.current) {
              videoInputRef.current.click()
            } else {
              console.error('videoInputRef.current не найден')
            }
          }}
        >
          <Video className="h-4 w-4 mr-1" />
          <span className="text-xs">Загрузить</span>
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
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        .ProseMirror video {
          max-width: 100%;
          border-radius: 8px;
          margin: 16px 0;
        }
        .ProseMirror iframe {
          max-width: 100%;
          border-radius: 8px;
          margin: 16px 0;
        }
      `}} />
      
      {/* Модальное окно для ввода URL */}
      <Dialog open={urlDialogOpen} onOpenChange={(open) => {
        console.log('Dialog onOpenChange вызван, open:', open)
        setUrlDialogOpen(open)
      }}>
        <DialogContent className="gradient-card border-0 shadow-xl" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle>
              {urlDialogType === 'link' ? 'Вставить ссылку' : urlDialogType === 'image' ? 'Вставить изображение' : 'Вставить видео'}
            </DialogTitle>
            <DialogDescription>
              {urlDialogType === 'link'
                ? 'Введите URL ссылки. Если текст выделен, ссылка будет применена к нему, иначе URL будет вставлен как текст со ссылкой.'
                : urlDialogType === 'image' 
                ? 'Введите URL изображения или ссылку на изображение в интернете'
                : 'Введите URL видео (YouTube, Vimeo или прямую ссылку на видеофайл)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">
                {urlDialogType === 'link' ? 'URL ссылки' : urlDialogType === 'image' ? 'URL изображения' : 'URL видео'}
              </Label>
              <Input
                id="url-input"
                placeholder={urlDialogType === 'link'
                  ? 'https://example.com'
                  : urlDialogType === 'image' 
                  ? 'https://example.com/image.jpg'
                  : 'https://youtube.com/watch?v=... или https://example.com/video.mp4'}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlInsert()
                  }
                }}
                className="w-full"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUrlDialogOpen(false)
                setUrlInput('')
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleUrlInsert}
              className="gradient-primary text-white"
              disabled={!urlInput.trim()}
            >
              Вставить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
