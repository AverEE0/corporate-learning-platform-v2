import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { groupDb } from '@/lib/database'
import { auditLogDb, getClientIp, getUserAgent } from '@/lib/audit-log'

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

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 403 }
      )
    }

    const groups = await groupDb.getAllGroups()

    return NextResponse.json({
      success: true,
      groups,
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        { success: false, error: 'Только администратор может создавать группы' },
        { status: 403 }
      )
    }

    const { name, description, managerId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Название группы обязательно' },
        { status: 400 }
      )
    }

    // Обрабатываем managerId: если undefined, null, "none" или пустая строка - делаем undefined
    let processedManagerId: number | undefined = undefined
    if (managerId && managerId !== "none" && managerId !== "") {
      const parsed = parseInt(String(managerId))
      processedManagerId = isNaN(parsed) ? undefined : parsed
    }

    try {
      const group = await groupDb.createGroup({
        name: name.trim(),
        description: description?.trim() || null,
        managerId: processedManagerId,
        createdBy: user.id,
      })

      // Логируем создание группы
      try {
        await auditLogDb.createLog({
          user_id: user.id,
          action: 'group.created',
          resource_type: 'group',
          resource_id: group.id,
          details: {
            name: group.name,
            managerId: processedManagerId,
          },
          ip_address: getClientIp(request),
          user_agent: getUserAgent(request),
        })
      } catch (auditError) {
        console.error('Error creating audit log:', auditError)
      }

      return NextResponse.json({
        success: true,
        group,
      })
    } catch (error: any) {
      console.error('Error creating group:', error)
      // Проверяем на конфликт уникальности имени
      if (error.message && error.message.includes('duplicate key') || error.message.includes('UNIQUE')) {
        return NextResponse.json(
          { success: false, error: 'Группа с таким названием уже существует' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: error.message || 'Ошибка создания группы' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in POST /api/groups:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

