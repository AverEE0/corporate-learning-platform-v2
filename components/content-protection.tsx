"use client"

import { useEffect } from "react"

interface ContentProtectionProps {
  children: React.ReactNode
  enabled?: boolean
}

export function ContentProtection({ children, enabled = true }: ContentProtectionProps) {
  useEffect(() => {
    if (!enabled) return

    // Отключаем выделение текста через CSS
    const style = document.createElement('style')
    style.textContent = `
      .content-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .content-protected * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      .content-protected input,
      .content-protected textarea,
      .content-protected [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `
    document.head.appendChild(style)

    // Отключаем правый клик
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Отключаем горячие клавиши
    const handleKeyDown = (e: KeyboardEvent) => {
      // Отключаем Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+V, Ctrl+S, Ctrl+P
      if (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 'x' || e.key === 'v' || e.key === 's' || e.key === 'p')) {
        e.preventDefault()
        return false
      }
      // Отключаем F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }
      // Отключаем Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        return false
      }
      // Отключаем Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        return false
      }
      // Отключаем Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault()
        return false
      }
      // Отключаем Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        return false
      }
    }

    // Отключаем перетаскивание изображений
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault()
        return false
      }
    }

    // Предупреждение при попытке копирования через буфер обмена API
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      alert('Копирование контента запрещено')
      return false
    }

    // Добавляем обработчики
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('copy', handleCopy)

    // Добавляем класс к body
    document.body.classList.add('content-protected')

    return () => {
      // Удаляем обработчики при размонтировании
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('copy', handleCopy)
      document.body.classList.remove('content-protected')
      document.head.removeChild(style)
    }
  }, [enabled])

  return <>{children}</>
}

