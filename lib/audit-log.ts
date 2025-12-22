// Система аудит логов для отслеживания действий пользователей

import { executeQuery } from './database'

export interface AuditLog {
  id?: number
  user_id: number
  action: string
  resource_type: string
  resource_id?: number
  details?: any
  ip_address?: string
  user_agent?: string
  created_at?: Date
}

export const auditLogDb = {
  async createLog(log: AuditLog): Promise<void> {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
    
    await executeQuery(query, [
      log.user_id,
      log.action,
      log.resource_type,
      log.resource_id || null,
      log.details ? JSON.stringify(log.details) : null,
      log.ip_address || null,
      log.user_agent || null,
    ])
  },

  async getLogs(filters: {
    userId?: number
    action?: string
    resourceType?: string
    resourceId?: number
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  } = {}): Promise<any[]> {
    let query = `
      SELECT 
        al.*,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (filters.userId) {
      query += ` AND al.user_id = $${paramIndex++}`
      params.push(filters.userId)
    }

    if (filters.action) {
      query += ` AND al.action = $${paramIndex++}`
      params.push(filters.action)
    }

    if (filters.resourceType) {
      query += ` AND al.resource_type = $${paramIndex++}`
      params.push(filters.resourceType)
    }

    if (filters.resourceId) {
      query += ` AND al.resource_id = $${paramIndex++}`
      params.push(filters.resourceId)
    }

    if (filters.startDate) {
      query += ` AND al.created_at >= $${paramIndex++}`
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      query += ` AND al.created_at <= $${paramIndex++}`
      params.push(filters.endDate)
    }

    query += ` ORDER BY al.created_at DESC`

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`
      params.push(filters.limit)
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`
      params.push(filters.offset)
    }

    return executeQuery(query, params)
  },
}

// Вспомогательная функция для получения IP адреса из запроса
export function getClientIp(request: { headers: { get: (key: string) => string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded ? forwarded.split(',')[0].trim() : (realIp || 'unknown')
}

// Вспомогательная функция для получения User-Agent
export function getUserAgent(request: { headers: { get: (key: string) => string | null } }): string {
  return request.headers.get('user-agent') || 'unknown'
}

