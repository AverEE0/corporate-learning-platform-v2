import { Pool } from 'pg'

// Create connection pool with proper error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err)
})

export async function executeQuery(query: string, params: any[] = []) {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: query must be a non-empty string')
    }

    // Валидация параметров
    if (!Array.isArray(params)) {
      throw new Error('Invalid params: params must be an array')
    }

    // Проверка на SQL injection (базовая валидация)
    const dangerousPatterns = /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)/i
    if (dangerousPatterns.test(query)) {
      console.error('Potentially dangerous SQL query detected:', query.substring(0, 100))
      throw new Error('Potentially dangerous SQL query detected')
    }

    const result = await pool.query(query, params)
    return result.rows || []
  } catch (error: any) {
    // Улучшенное логирование
    const errorDetails = {
      message: error?.message || 'Unknown database error',
      code: error?.code,
      detail: error?.detail,
      query: query?.substring(0, 200), // Логируем только начало запроса
      paramsCount: params?.length || 0,
      timestamp: new Date().toISOString(),
    }
    
    console.error('Database error:', JSON.stringify(errorDetails, null, 2))
    
    // Преобразуем известные ошибки PostgreSQL в понятные сообщения
    if (error?.code === '23505') { // Unique violation
      throw new Error('Запись с такими данными уже существует')
    } else if (error?.code === '23503') { // Foreign key violation
      throw new Error('Нарушение целостности данных: связанная запись не найдена')
    } else if (error?.code === '23502') { // Not null violation
      throw new Error('Обязательное поле не заполнено')
    } else if (error?.code === '42P01') { // Table does not exist
      throw new Error('Таблица не существует в базе данных')
    }
    
    throw error
  }
}

export async function executeQuerySimple(query: TemplateStringsArray, ...values: any[]) {
  try {
    let queryString = query[0]
    const params: any[] = []
    for (let i = 0; i < values.length; i++) {
      params.push(values[i])
      queryString += `$${i + 1}` + query[i + 1]
    }
    const result = await pool.query(queryString, params)
    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

export const userDb = {
  async createUser(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'admin' | 'manager' | 'student'
  }) {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await executeQuery(query, [data.email, data.password, data.firstName, data.lastName, data.role])
    return Array.isArray(result) ? result : [result]
  },

  async getUserByEmail(email: string) {
    const query = `SELECT * FROM users WHERE email = $1`
    const result = await executeQuery(query, [email])
    if (Array.isArray(result)) {
      return result[0] || null
    }
    return result || null
  },

  async getAllStudents() {
    const query = `
      SELECT 
        u.*,
        COUNT(DISTINCT ce.course_id) as enrolled_courses,
        COUNT(DISTINCT ca.course_id) as assigned_courses,
        COALESCE(AVG(up.score), 0) as average_score,
        MAX(up.updated_at) as last_activity
      FROM users u
      LEFT JOIN course_enrollments ce ON u.id = ce.user_id
      LEFT JOIN course_assignments ca ON u.id = ca.assigned_to
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.password_hash, u.role, u.created_at, u.last_login
    `
    return executeQuery(query)
  },
}

export const courseDb = {
  async createCourse(data: {
    title: string
    description: string
    createdBy: number
    status?: string
  }) {
    const query = `
      INSERT INTO courses (title, description, created_by, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await executeQuery(query, [data.title, data.description, data.createdBy, data.status || 'draft'])
    return Array.isArray(result) ? result : [result]
  },

  async getCoursesByManager(managerId: number) {
    const query = `
      SELECT c.*, 
        COUNT(DISTINCT l.id) as lesson_count,
        COUNT(DISTINCT ce.user_id) as enrolled_students
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE c.created_by = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    return executeQuery(query, [managerId])
  },

  async getAllCourses(onlyPublished: boolean = false) {
    const statusFilter = onlyPublished ? "WHERE c.status = 'published'" : ""
    const query = `
      SELECT c.*, 
        COUNT(DISTINCT l.id) as lesson_count,
        COUNT(DISTINCT ce.user_id) as enrolled_students
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      ${statusFilter}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    return executeQuery(query)
  },

  async getPublishedCourses() {
    return this.getAllCourses(true)
  },
}

export const progressDb = {
  async updateProgress(data: {
    userId: number
    courseId: number
    lessonId?: number
    blockId?: number
    completionPercentage: number
    score?: number
    timeSpent?: number
    completed: boolean
    answers?: any
  }) {
    // Обновляем attempts для course_assignments если есть
    if (data.completed) {
      try {
        await executeQuery(
          `UPDATE course_assignments 
           SET attempts = attempts + 1 
           WHERE course_id = $1 AND assigned_to = $2`,
          [data.courseId, data.userId]
        )
      } catch (error: any) {
        // Игнорируем ошибки, если таблица или колонка не существуют
        // или если назначение не найдено
        console.error('Error updating course_assignments attempts:', error?.message)
      }
    }
    const completedAtValue = data.completed ? 'CURRENT_TIMESTAMP' : 'NULL'
    const query = `
      INSERT INTO user_progress (
        user_id, course_id, lesson_id, block_id,
        completion_percentage, score, time_spent, completed, answers, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${completedAtValue})
      ON CONFLICT (user_id, course_id, lesson_id, block_id)
      DO UPDATE SET
        completion_percentage = EXCLUDED.completion_percentage,
        score = EXCLUDED.score,
        time_spent = EXCLUDED.time_spent,
        completed = EXCLUDED.completed,
        answers = EXCLUDED.answers,
        completed_at = CASE WHEN EXCLUDED.completed = TRUE AND user_progress.completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE user_progress.completed_at END,
        updated_at = CURRENT_TIMESTAMP
    `
    await executeQuery(query, [
      data.userId,
      data.courseId,
      data.lessonId || null,
      data.blockId || null,
      data.completionPercentage,
      data.score || 0,
      data.timeSpent || 0,
      data.completed,
      JSON.stringify(data.answers || {}),
    ])
  },

  async getUserProgress(userId: number, courseId: number) {
    const query = `
      SELECT * FROM user_progress
      WHERE user_id = $1 AND course_id = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `
    const result = await executeQuery(query, [userId, courseId])
    return Array.isArray(result) ? result : [result]
  },
}

export const groupDb = {
  async createGroup(data: {
    name: string
    description?: string
    managerId?: number
    createdBy: number
  }) {
    const query = `
      INSERT INTO groups (name, description, manager_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await executeQuery(query, [
      data.name,
      data.description || null,
      data.managerId || null,
      data.createdBy,
    ])
    return Array.isArray(result) ? result[0] : result
  },

  async getAllGroups() {
    const query = `
      SELECT g.*, 
             u.first_name as manager_first_name,
             u.last_name as manager_last_name,
             u.email as manager_email,
             COUNT(DISTINCT ug.user_id) as user_count
      FROM groups g
      LEFT JOIN users u ON g.manager_id = u.id
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      GROUP BY g.id, u.first_name, u.last_name, u.email
      ORDER BY g.created_at DESC
    `
    return executeQuery(query)
  },

  async getGroupById(id: number) {
    const query = `
      SELECT g.*, 
             u.first_name as manager_first_name,
             u.last_name as manager_last_name,
             u.email as manager_email
      FROM groups g
      LEFT JOIN users u ON g.manager_id = u.id
      WHERE g.id = $1
    `
    const result = await executeQuery(query, [id])
    return Array.isArray(result) ? result[0] : result
  },

  async updateGroup(id: number, data: {
    name?: string
    description?: string
    managerId?: number
  }) {
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(data.name)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      params.push(data.description)
    }
    if (data.managerId !== undefined) {
      updates.push(`manager_id = $${paramIndex++}`)
      params.push(data.managerId)
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(id)

    const query = `
      UPDATE groups
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `
    const result = await executeQuery(query, params)
    return Array.isArray(result) ? result[0] : result
  },

  async deleteGroup(id: number) {
    const query = `DELETE FROM groups WHERE id = $1`
    await executeQuery(query, [id])
  },

  async addUserToGroup(userId: number, groupId: number) {
    const query = `
      INSERT INTO user_groups (user_id, group_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, group_id) DO NOTHING
      RETURNING *
    `
    const result = await executeQuery(query, [userId, groupId])
    // Also update user's primary group_id
    await executeQuery(
      `UPDATE users SET group_id = $1 WHERE id = $2`,
      [groupId, userId]
    )
    return Array.isArray(result) ? result[0] : result
  },

  async removeUserFromGroup(userId: number, groupId: number) {
    const query = `DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2`
    await executeQuery(query, [userId, groupId])
  },

  async getGroupUsers(groupId: number) {
    const query = `
      SELECT u.*
      FROM users u
      INNER JOIN user_groups ug ON u.id = ug.user_id
      WHERE ug.group_id = $1
      ORDER BY u.last_name, u.first_name
    `
    return executeQuery(query, [groupId])
  },

  async getUserGroups(userId: number) {
    const query = `
      SELECT g.*
      FROM groups g
      INNER JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = $1
    `
    return executeQuery(query, [userId])
  },
}

export const analyticsDb = {
  async getCourseStatistics(courseId: number) {
    const query = `
      SELECT 
        COUNT(DISTINCT ce.user_id) as total_enrolled,
        COUNT(DISTINCT CASE WHEN up.completed = true THEN up.user_id END) as completed_count,
        AVG(up.completion_percentage) as avg_completion,
        AVG(up.score) as avg_score,
        AVG(up.time_spent) as avg_time_spent
      FROM course_enrollments ce
      LEFT JOIN user_progress up ON ce.user_id = up.user_id AND ce.course_id = up.course_id
      WHERE ce.course_id = $1
      GROUP BY ce.course_id
    `
    const result = await executeQuery(query, [courseId])
    return Array.isArray(result) ? result[0] : result
  },

  async getLessonStatistics(courseId: number, lessonId: number) {
    const query = `
      SELECT 
        COUNT(DISTINCT up.user_id) as total_attempts,
        COUNT(DISTINCT CASE WHEN up.completed = true THEN up.user_id END) as completed_count,
        AVG(up.score) as avg_score,
        AVG(up.time_spent) as avg_time_spent
      FROM user_progress up
      WHERE up.course_id = $1 AND up.lesson_id = $2
    `
    const result = await executeQuery(query, [courseId, lessonId])
    return Array.isArray(result) ? result[0] : result
  },

  async getBlockStatistics(blockId: number) {
    const query = `
      SELECT 
        COUNT(DISTINCT up.user_id) as total_attempts,
        COUNT(DISTINCT CASE WHEN up.completed = true THEN up.user_id END) as completed_count,
        AVG(up.score) as avg_score
      FROM user_progress up
      WHERE up.block_id = $1
    `
    const result = await executeQuery(query, [blockId])
    return Array.isArray(result) ? result[0] : result
  },

  async getUserProgressDetails(userId: number, courseId: number) {
    const query = `
      SELECT 
        l.id as lesson_id,
        l.title as lesson_title,
        b.id as block_id,
        b.type as block_type,
        b.title as block_title,
        up.completed,
        up.score,
        up.answers,
        up.time_spent,
        up.completed_at
      FROM user_progress up
      INNER JOIN lessons l ON up.lesson_id = l.id
      INNER JOIN blocks b ON up.block_id = b.id
      WHERE up.user_id = $1 AND up.course_id = $2
      ORDER BY l.id, b.order_index
    `
    return executeQuery(query, [userId, courseId])
  },
}

export const notificationDb = {
  async createNotification(data: {
    userId: number
    title: string
    message?: string
    type?: 'info' | 'success' | 'warning' | 'error'
  }) {
    const query = `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await executeQuery(query, [
      data.userId,
      data.title,
      data.message || null,
      data.type || 'info',
    ])
    return Array.isArray(result) ? result[0] : result
  },

  async getUserNotifications(userId: number, unreadOnly: boolean = false) {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `
    const params: any[] = [userId]
    
    if (unreadOnly) {
      query += ` AND read = false`
    }
    
    query += ` ORDER BY created_at DESC`
    
    return executeQuery(query, params)
  },

  async markAsRead(notificationId: number) {
    const query = `UPDATE notifications SET read = true WHERE id = $1`
    await executeQuery(query, [notificationId])
  },
}

export const commentDb = {
  async createComment(data: {
    blockId: number
    userId: number
    comment: string
  }) {
    const query = `
      INSERT INTO block_comments (block_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING *
    `
    const result = await executeQuery(query, [data.blockId, data.userId, data.comment])
    return Array.isArray(result) ? result[0] : result
  },

  async getBlockComments(blockId: number) {
    const query = `
      SELECT bc.*, u.first_name, u.last_name, u.email
      FROM block_comments bc
      INNER JOIN users u ON bc.user_id = u.id
      WHERE bc.block_id = $1
      ORDER BY bc.created_at DESC
    `
    return executeQuery(query, [blockId])
  },
}

export const certificateDb = {
  async createCertificate(data: {
    userId: number
    courseId: number
    certificateNumber: string
    filePath?: string
    metadata?: any
  }) {
    const query = `
      INSERT INTO certificates (user_id, course_id, certificate_number, file_path, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await executeQuery(query, [
      data.userId,
      data.courseId,
      data.certificateNumber,
      data.filePath || null,
      JSON.stringify(data.metadata || {}),
    ])
    return Array.isArray(result) ? result[0] : result
  },

  async getUserCertificates(userId: number) {
    const query = `
      SELECT c.*, co.title as course_title
      FROM certificates c
      INNER JOIN courses co ON c.course_id = co.id
      WHERE c.user_id = $1
      ORDER BY c.issued_at DESC
    `
    return executeQuery(query, [userId])
  },

  async getCertificateByNumber(certificateNumber: string) {
    const query = `
      SELECT c.*, u.first_name, u.last_name, co.title as course_title
      FROM certificates c
      INNER JOIN users u ON c.user_id = u.id
      INNER JOIN courses co ON c.course_id = co.id
      WHERE c.certificate_number = $1
    `
    const result = await executeQuery(query, [certificateNumber])
    return Array.isArray(result) ? result[0] : result
  },
}
