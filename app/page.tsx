"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
          style={{ opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Современная платформа обучения</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Корпоративное Обучение
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Создавайте интерактивные курсы, отслеживайте прогресс студентов и развивайте навыки вашей команды
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="gradient-primary text-white shadow-lg hover:shadow-xl"
              onClick={() => router.push("/login")}
            >
              Начать работу
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("/register")}
            >
              Регистрация
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ opacity: 1 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle>Интерактивные Курсы</CardTitle>
                <CardDescription>
                  Создавайте курсы с видео, аудио, тестами и интерактивными заданиями
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ opacity: 1 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle>Управление Студентами</CardTitle>
                <CardDescription>
                  Назначайте курсы, отслеживайте прогресс и анализируйте результаты обучения
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ opacity: 1 }}
          >
            <Card className="gradient-card border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Аналитика и Отчеты</CardTitle>
                <CardDescription>
                  Получайте детальную аналитику по прогрессу студентов и эффективности курсов
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

