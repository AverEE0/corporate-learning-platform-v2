import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { auditLogDb } from '@/lib/audit-log'

export async function GET(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Только администратор может просматривать аудит логи' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const logs = await auditLogDb.getLogs({
      userId: userId ? parseInt(userId) : undefined,
      action: action || undefined,
      resourceType: resourceType || undefined,
      resourceId: resourceId ? parseInt(resourceId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    })

    // Парсим JSON детали
    const formattedLogs = logs.map((log: any) => {
      try {
        return {
          ...log,
          details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
        }
      } catch (e) {
        return {
          ...log,
          details: log.details,
        }
      }
    })

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      total: formattedLogs.length,
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

