"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, ArrowLeft, Save, Shield, Mail, Database, Globe, Bell, FileText, Users, Lock, Zap } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Общие настройки
    platformName: "Корпоративная платформа обучения",
    platformDescription: "Платформа для корпоративного обучения сотрудников",
    defaultLanguage: "ru",
    timezone: "Europe/Moscow",
    
    // Регистрация и доступ
    allowRegistration: true,
    requireEmailVerification: true,
    requireAdminApproval: false,
    defaultUserRole: "student",
    
    // Безопасность
    passwordMinLength: "8",
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    twoFactorAuth: false,
    autoLogout: true,
    
    // Уведомления
    emailNotifications: true,
    emailEnabled: true,
    emailFromName: "Платформа обучения",
    emailFromAddress: "noreply@ykz.tw1.ru",
    emailSmtpHost: "smtp.gmail.com",
    emailSmtpPort: "587",
    emailSmtpUser: "",
    emailSmtpPassword: "",
    emailFrom: "noreply@ykz.tw1.ru",
    telegramNotifications: false,
    telegramBotToken: "",
    smsNotifications: false,
    
    // Файлы и хранилище
    maxFileSize: "50",
    allowedFileTypes: "pdf,doc,docx,xls,xlsx,ppt,pptx,mp4,mp3,zip,jpg,jpeg,png",
    maxUploadsPerUser: "100",
    storageQuotaPerUser: "1000",
    
    // Курсы
    defaultCourseStatus: "draft",
    allowPublicCourses: false,
    maxAttemptsPerCourse: "3",
    allowCourseComments: true,
    
    // Интеграции
    bitrix24Enabled: false,
    bitrix24WebhookUrl: "",
    telegramBotEnabled: false,
    telegramBotApiToken: "",
    
    // Внешний вид
    theme: "auto",
    primaryColor: "#10b981",
    logoUrl: "",
    faviconUrl: "",
    
    // Производительность
    enableCaching: true,
    cacheTimeout: "3600",
    enableCDN: false,
    cdnUrl: "",
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }))
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    
    if (user && user.role === 'admin') {
      loadSettings()
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        toast.success("Настройки успешно сохранены")
      } else {
        throw new Error('Ошибка сохранения')
      }
    } catch (error) {
      toast.error("Ошибка сохранения настроек")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <h1 className="text-xl font-bold">Настройки системы</h1>
              </div>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gradient-primary text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Сохранение..." : "Сохранить все настройки"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">
              <Globe className="h-4 w-4 mr-2" />
              Общие
            </TabsTrigger>
            <TabsTrigger value="access">
              <Users className="h-4 w-4 mr-2" />
              Доступ
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Безопасность
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Уведомления
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-2" />
              Файлы
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Zap className="h-4 w-4 mr-2" />
              Интеграции
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Lock className="h-4 w-4 mr-2" />
              Внешний вид
            </TabsTrigger>
          </TabsList>

          {/* Общие настройки */}
          <TabsContent value="general">
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Общие настройки платформы</CardTitle>
                <CardDescription>Основная конфигурация системы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Название платформы</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    placeholder="Введите название платформы"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platformDescription">Описание платформы</Label>
                  <Textarea
                    id="platformDescription"
                    value={settings.platformDescription}
                    onChange={(e) => setSettings({ ...settings, platformDescription: e.target.value })}
                    placeholder="Краткое описание платформы"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Язык по умолчанию</Label>
                    <Select
                      value={settings.defaultLanguage}
                      onValueChange={(value) => setSettings({ ...settings, defaultLanguage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="kz">Қазақша</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Часовой пояс</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Moscow">Москва (GMT+3)</SelectItem>
                        <SelectItem value="Asia/Almaty">Алматы (GMT+6)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Регистрация и доступ */}
          <TabsContent value="access">
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Регистрация и доступ пользователей</CardTitle>
                <CardDescription>Настройки регистрации и управления доступом</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Разрешить регистрацию новых пользователей</Label>
                    <p className="text-sm text-muted-foreground">
                      Разрешить самостоятельную регистрацию на платформе
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Требовать подтверждение email</Label>
                    <p className="text-sm text-muted-foreground">
                      Пользователи должны подтвердить email перед активацией аккаунта
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Требовать одобрение администратора</Label>
                    <p className="text-sm text-muted-foreground">
                      Новые пользователи требуют одобрения администратора
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireAdminApproval}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireAdminApproval: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultUserRole">Роль по умолчанию для новых пользователей</Label>
                  <Select
                    value={settings.defaultUserRole}
                    onValueChange={(value) => setSettings({ ...settings, defaultUserRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Студент</SelectItem>
                      <SelectItem value="manager">Менеджер</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Безопасность */}
          <TabsContent value="security">
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Настройки безопасности</CardTitle>
                <CardDescription>Политики безопасности и защиты данных</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Политика паролей</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Минимальная длина пароля</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={settings.passwordMinLength}
                      onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
                      min="6"
                      max="32"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Требовать заглавные буквы</Label>
                    <Switch
                      checked={settings.passwordRequireUppercase}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireUppercase: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Требовать цифры</Label>
                    <Switch
                      checked={settings.passwordRequireNumbers}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireNumbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Требовать специальные символы</Label>
                    <Switch
                      checked={settings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireSpecialChars: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Сессии и вход</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Таймаут сессии (минуты)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                      min="5"
                      max="480"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Максимум попыток входа</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                      min="3"
                      max="10"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Автоматический выход при бездействии</Label>
                      <p className="text-sm text-muted-foreground">
                        Автоматически выходить пользователей при истечении сессии
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoLogout}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoLogout: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Двухфакторная аутентификация (2FA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Включить возможность использования 2FA для пользователей
                      </p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Уведомления */}
          <TabsContent value="notifications">
            {user?.role === 'admin' ? (
              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Настройки уведомлений платформы</CardTitle>
                  <CardDescription>Конфигурация каналов уведомлений для всей системы</CardDescription>
                </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email уведомления
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Включить email уведомления</Label>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailFrom">Email отправителя</Label>
                    <Input
                      id="emailFrom"
                      type="email"
                      value={settings.emailFrom}
                      onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                      placeholder="noreply@example.com"
                    />
                    <p className="text-sm text-muted-foreground">Email адрес, с которого будут отправляться уведомления</p>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">Настройки SMTP сервера</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailSmtpHost">SMTP хост</Label>
                        <Input
                          id="emailSmtpHost"
                          value={settings.emailSmtpHost}
                          onChange={(e) => setSettings({ ...settings, emailSmtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailSmtpPort">SMTP порт</Label>
                        <Input
                          id="emailSmtpPort"
                          value={settings.emailSmtpPort}
                          onChange={(e) => setSettings({ ...settings, emailSmtpPort: e.target.value })}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailSmtpUser">SMTP пользователь</Label>
                        <Input
                          id="emailSmtpUser"
                          type="email"
                          value={settings.emailSmtpUser}
                          onChange={(e) => setSettings({ ...settings, emailSmtpUser: e.target.value })}
                          placeholder="your-email@gmail.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emailSmtpPassword">SMTP пароль</Label>
                        <Input
                          id="emailSmtpPassword"
                          type="password"
                          value={settings.emailSmtpPassword}
                          onChange={(e) => setSettings({ ...settings, emailSmtpPassword: e.target.value })}
                          placeholder="Пароль или App Password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailFromName">Имя отправителя</Label>
                      <Input
                        id="emailFromName"
                        value={settings.emailFromName}
                        onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Telegram уведомления</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Включить Telegram уведомления</Label>
                    <Switch
                      checked={settings.telegramNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, telegramNotifications: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegramBotToken">Токен Telegram бота</Label>
                    <Input
                      id="telegramBotToken"
                      type="password"
                      value={settings.telegramBotToken}
                      onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                      placeholder="Введите токен бота"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">SMS уведомления</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Включить SMS уведомления</Label>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            ) : (
              <Card className="gradient-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Настройки уведомлений</CardTitle>
                  <CardDescription>Управление вашими настройками уведомлений</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Настройки уведомлений для пользователей находятся в разработке</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Файлы */}
          <TabsContent value="files">
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Настройки файлов и хранилища</CardTitle>
                <CardDescription>Ограничения и правила для загрузки файлов</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Максимальный размер файла (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
                    min="1"
                    max="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedFileTypes">Разрешенные типы файлов</Label>
                  <Input
                    id="allowedFileTypes"
                    value={settings.allowedFileTypes}
                    onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                    placeholder="pdf,doc,docx,mp4,jpg,png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Укажите расширения файлов через запятую
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUploadsPerUser">Макс. файлов на пользователя</Label>
                    <Input
                      id="maxUploadsPerUser"
                      type="number"
                      value={settings.maxUploadsPerUser}
                      onChange={(e) => setSettings({ ...settings, maxUploadsPerUser: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storageQuotaPerUser">Квота хранилища на пользователя (MB)</Label>
                    <Input
                      id="storageQuotaPerUser"
                      type="number"
                      value={settings.storageQuotaPerUser}
                      onChange={(e) => setSettings({ ...settings, storageQuotaPerUser: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Интеграции */}
          <TabsContent value="integrations">
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Интеграции с внешними системами</CardTitle>
                <CardDescription>Настройка интеграций с CRM и мессенджерами</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Bitrix24</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Включить интеграцию с Bitrix24</Label>
                    <Switch
                      checked={settings.bitrix24Enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, bitrix24Enabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bitrix24WebhookUrl">URL вебхука Bitrix24</Label>
                    <Input
                      id="bitrix24WebhookUrl"
                      type="url"
                      value={settings.bitrix24WebhookUrl}
                      onChange={(e) => setSettings({ ...settings, bitrix24WebhookUrl: e.target.value })}
                      placeholder="https://your-domain.bitrix24.ru/rest/1/webhook_code/"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Telegram Bot</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Включить Telegram бота</Label>
                    <Switch
                      checked={settings.telegramBotEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, telegramBotEnabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegramBotApiToken">API токен Telegram бота</Label>
                    <Input
                      id="telegramBotApiToken"
                      type="password"
                      value={settings.telegramBotApiToken}
                      onChange={(e) => setSettings({ ...settings, telegramBotApiToken: e.target.value })}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Внешний вид */}
          <TabsContent value="appearance">
            <Card className="gradient-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Настройки внешнего вида</CardTitle>
                <CardDescription>Персонализация интерфейса платформы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Тема оформления</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => setSettings({ ...settings, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Светлая</SelectItem>
                        <SelectItem value="dark">Темная</SelectItem>
                        <SelectItem value="auto">Автоматически</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Основной цвет</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL логотипа</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      value={settings.logoUrl}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">URL иконки сайта (favicon)</Label>
                    <Input
                      id="faviconUrl"
                      type="url"
                      value={settings.faviconUrl}
                      onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                      placeholder="/favicon.ico"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Производительность</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Включить кэширование</Label>
                    <Switch
                      checked={settings.enableCaching}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableCaching: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cacheTimeout">Таймаут кэша (секунды)</Label>
                    <Input
                      id="cacheTimeout"
                      type="number"
                      value={settings.cacheTimeout}
                      onChange={(e) => setSettings({ ...settings, cacheTimeout: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Использовать CDN</Label>
                    <Switch
                      checked={settings.enableCDN}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableCDN: checked })}
                    />
                  </div>

                  {settings.enableCDN && (
                    <div className="space-y-2">
                      <Label htmlFor="cdnUrl">URL CDN</Label>
                      <Input
                        id="cdnUrl"
                        type="url"
                        value={settings.cdnUrl}
                        onChange={(e) => setSettings({ ...settings, cdnUrl: e.target.value })}
                        placeholder="https://cdn.example.com"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

