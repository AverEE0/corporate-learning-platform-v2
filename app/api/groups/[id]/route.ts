import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { groupDb } from '@/lib/database'
import { auditLogDb, getClientIp, getUserAgent } from '@/lib/audit-log'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный токен' },
        { status: 401 }
      )
    }

    const { id } = await params
    const group = await groupDb.getGroupById(parseInt(id))
    
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    const users = await groupDb.getGroupUsers(parseInt(id))

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        users,
      },
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: 'Только администратор может редактировать группы' },
        { status: 403 }
      )
    }

    const { id } = await params
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

    const group = await groupDb.updateGroup(parseInt(id), {
      name: name.trim(),
      description: description?.trim() || null,
      managerId: processedManagerId,
    })

    // Логируем обновление группы
    try {
      await auditLogDb.createLog({
        user_id: user.id,
        action: 'group.updated',
        resource_type: 'group',
        resource_id: parseInt(id),
        details: {
          name: name.trim(),
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
    console.error('Error updating group:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: 'Только администратор может удалять группы' },
        { status: 403 }
      )
    }

    const { id } = await params
    const groupId = parseInt(id)
    
    // Получаем информацию о группе перед удалением для лога
    const group = await groupDb.getGroupById(groupId)
    
    await groupDb.deleteGroup(groupId)

    // Логируем удаление группы
    try {
      await auditLogDb.createLog({
        user_id: user.id,
        action: 'group.deleted',
        resource_type: 'group',
        resource_id: groupId,
        details: {
          name: group?.name,
        },
        ip_address: getClientIp(request),
        user_agent: getUserAgent(request),
      })
    } catch (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      message: 'Группа удалена',
    })
  } catch (error: any) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

