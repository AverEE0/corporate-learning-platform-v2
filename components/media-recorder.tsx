"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Video, Square, Play, Pause, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface MediaRecorderProps {
  type: "audio" | "video"
  onRecordingComplete?: (blob: Blob, url: string) => void
  onError?: (error: Error) => void
  maxDuration?: number
  title?: string
  description?: string
}

export function MediaRecorder({
  type,
  onRecordingComplete,
  onError,
  maxDuration = 300,
  title,
  description,
}: MediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const mediaRecorderRef = useRef<globalThis.MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [stream, recordedUrl])

  const startRecording = async () => {
    try {
      const constraints = type === "video" 
        ? { video: true, audio: true } 
        : { audio: true }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (type === "video" && videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      const MediaRecorderClass = globalThis.MediaRecorder
      const mediaRecorder = new MediaRecorderClass(mediaStream, {
        mimeType: type === "video"
          ? (MediaRecorderClass.isTypeSupported("video/webm") ? "video/webm" : "video/mp4")
          : (MediaRecorderClass.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"),
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, {
            type: type === "video" ? "video/webm" : "audio/webm",
          })
          const url = URL.createObjectURL(blob)

          setRecordedBlob(blob)
          setRecordedUrl(url)

          // Автоматически загружаем на сервер
          try {
            const formData = new FormData()
            const fileName = `recording-${Date.now()}.${type === "video" ? "webm" : "webm"}`
            formData.append("file", blob, fileName)
            formData.append("type", type)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json()
              const serverUrl = uploadResult.url || uploadResult.file?.url

              if (onRecordingComplete) {
                onRecordingComplete(blob, serverUrl)
              }

              toast.success("Запись сохранена и загружена")
            } else {
              if (onRecordingComplete) {
                onRecordingComplete(blob, url)
              }
              toast.warning("Запись создана, но не удалось загрузить на сервер")
            }
          } catch (uploadError) {
            console.error("Ошибка загрузки:", uploadError)
            if (onRecordingComplete) {
              onRecordingComplete(blob, url)
            }
          }

          mediaStream.getTracks().forEach((track) => track.stop())
          setStream(null)
        } catch (error: any) {
          const recordingError = new Error(`Ошибка при обработке записи: ${error.message}`)
          if (onError) {
            onError(recordingError)
          }
          toast.error("Ошибка обработки записи")
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        const recordingError = new Error("Ошибка во время записи")
        if (onError) {
          onError(recordingError)
        }
        toast.error("Ошибка записи")
        stopRecording()
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return newDuration
        })
      }, 1000)

      toast.success("Запись началась")
    } catch (error: any) {
      let errorMessage = "Не удалось получить доступ к камере/микрофону"

      if (error.name === "NotAllowedError") {
        errorMessage = "Доступ запрещен. Разрешите доступ в настройках браузера."
      } else if (error.name === "NotFoundError") {
        errorMessage = `${type === "video" ? "Камера" : "Микрофон"} не найден(а).`
      }

      const accessError = new Error(errorMessage)
      if (onError) {
        onError(accessError)
      }
      toast.error(errorMessage)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (type === "video" && videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  const deleteRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    toast.success("Запись удалена")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="gradient-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {type === "video" ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {title || `Запись ${type === "video" ? "видео" : "аудио"}`}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        {type === "video" && (
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            {isRecording ? (
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            ) : recordedUrl ? (
              <video src={recordedUrl} controls className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Нажмите "Начать запись"</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio Player */}
        {type === "audio" && recordedUrl && !isRecording && (
          <div className="bg-muted rounded-lg p-4">
            <audio src={recordedUrl} controls className="w-full" />
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRecording && (
              <Badge variant={isPaused ? "secondary" : "destructive"}>
                {isPaused ? "Пауза" : "Запись"}
              </Badge>
            )}
            {recordedBlob && !isRecording && (
              <Badge variant="success">Готово</Badge>
            )}
          </div>
          <div className="text-sm font-mono">
            {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isRecording && !recordedBlob && (
            <Button onClick={startRecording} className="flex-1 gradient-primary text-white">
              {type === "video" ? <Video className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              Начать запись
            </Button>
          )}

          {isRecording && (
            <>
              <Button onClick={pauseRecording} variant="outline">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button onClick={stopRecording} variant="destructive" className="flex-1">
                <Square className="mr-2 h-4 w-4" />
                Остановить
              </Button>
            </>
          )}

          {recordedBlob && !isRecording && (
            <>
              <Button onClick={deleteRecording} variant="outline" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => setRecordedBlob(null)} className="flex-1">
                Записать заново
              </Button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isRecording && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

