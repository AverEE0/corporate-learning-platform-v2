import { executeQuery } from './database'

export interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  type: string
  points: number
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  earned_at: string
  progress: number
  achievement?: Achievement
}

/**
 * Получает все достижения пользователя
 */
export async function getUserAchievements(userId: number): Promise<UserAchievement[]> {
  const query = `
    SELECT 
      ua.*,
      a.code,
      a.name,
      a.description,
      a.icon,
      a.type,
      a.points
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1
    ORDER BY ua.earned_at DESC
  `
  
  const result: any = await executeQuery(query, [userId])
  return Array.isArray(result) ? result : [result]
}

/**
 * Проверяет и начисляет достижение пользователю
 */
export async function checkAndAwardAchievement(
  userId: number,
  achievementCode: string
): Promise<boolean> {
  try {
    // Получаем достижение
    const achievementQuery = `SELECT * FROM achievements WHERE code = $1`
    const achievementResult: any = await executeQuery(achievementQuery, [achievementCode])
    const achievement = Array.isArray(achievementResult) ? achievementResult[0] : achievementResult

    if (!achievement) {
      return false
    }

    // Проверяем, не получено ли уже достижение
    const existingQuery = `SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2`
    const existing: any = await executeQuery(existingQuery, [userId, achievement.id])
    
    if (Array.isArray(existing) && existing.length > 0) {
      return false // Уже получено
    }

    // Начисляем достижение
    const insertQuery = `
      INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES ($1, $2, 100)
      RETURNING *
    `
    await executeQuery(insertQuery, [userId, achievement.id])

    // Начисляем XP
    if (achievement.points > 0) {
      await addXP(userId, achievement.points, 'achievement', achievement.id, `Достижение: ${achievement.name}`)
    }

    return true
  } catch (error) {
    console.error('Error awarding achievement:', error)
    return false
  }
}

/**
 * Добавляет XP пользователю
 */
export async function addXP(
  userId: number,
  amount: number,
  source: string,
  sourceId?: number,
  description?: string
): Promise<void> {
  try {
    // Получаем текущий XP
    const xpQuery = `SELECT * FROM user_xp WHERE user_id = $1`
    const xpResult: any = await executeQuery(xpQuery, [userId])
    let userXP = Array.isArray(xpResult) ? xpResult[0] : xpResult

    if (!userXP) {
      // Создаем запись
      await executeQuery(
        `INSERT INTO user_xp (user_id, total_xp, level, xp_to_next_level) VALUES ($1, 0, 1, 100)`,
        [userId]
      )
      userXP = { total_xp: 0, level: 1, xp_to_next_level: 100 }
    }

    const newTotalXP = (userXP.total_xp || 0) + amount
    let newLevel = userXP.level || 1
    let xpToNextLevel = userXP.xp_to_next_level || 100

    // Проверяем, нужно ли повысить уровень
    while (newTotalXP >= xpToNextLevel) {
      newLevel++
      xpToNextLevel = calculateXPForLevel(newLevel)
    }

    // Обновляем XP
    await executeQuery(
      `UPDATE user_xp 
       SET total_xp = $1, level = $2, xp_to_next_level = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [newTotalXP, newLevel, xpToNextLevel, userId]
    )

    // Записываем в историю
    await executeQuery(
      `INSERT INTO xp_history (user_id, amount, source, source_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, amount, source, sourceId || null, description || null]
    )
  } catch (error) {
    console.error('Error adding XP:', error)
  }
}

/**
 * Вычисляет необходимый XP для уровня
 */
function calculateXPForLevel(level: number): number {
  // Формула: базовый XP * (уровень^1.5)
  return Math.floor(100 * Math.pow(level, 1.5))
}

/**
 * Получает статистику XP пользователя
 */
export async function getUserXP(userId: number): Promise<{
  total_xp: number
  level: number
  xp_to_next_level: number
  current_level_xp: number
} | null> {
  const query = `SELECT * FROM user_xp WHERE user_id = $1`
  const result: any = await executeQuery(query, [userId])
  const userXP = Array.isArray(result) ? result[0] : result

  if (!userXP) {
    return null
  }

  const previousLevelXP = userXP.level > 1 ? calculateXPForLevel(userXP.level - 1) : 0
  const currentLevelXP = userXP.total_xp - previousLevelXP

  return {
    total_xp: userXP.total_xp || 0,
    level: userXP.level || 1,
    xp_to_next_level: userXP.xp_to_next_level || 100,
    current_level_xp: currentLevelXP,
  }
}

/**
 * Проверяет достижения при завершении курса
 */
export async function checkCourseCompletionAchievements(userId: number, courseId: number): Promise<void> {
  // Подсчитываем количество завершенных курсов
  const completedCoursesQuery = `
    SELECT COUNT(DISTINCT course_id) as count
    FROM course_progress
    WHERE user_id = $1 AND completed = TRUE
  `
  const completedResult: any = await executeQuery(completedCoursesQuery, [userId])
  const completedCount = Array.isArray(completedResult) 
    ? completedResult[0]?.count || 0 
    : completedResult?.count || 0

  // Проверяем первое завершение
  if (completedCount === 1) {
    await checkAndAwardAchievement(userId, 'first_course')
  }

  // Проверяем 10 завершенных курсов
  if (completedCount >= 10) {
    await checkAndAwardAchievement(userId, 'course_master')
  }
}

/**
 * Проверяет достижения при идеальном результате теста
 */
export async function checkPerfectScoreAchievement(userId: number, quizId: number, score: number): Promise<void> {
  if (score === 100) {
    await checkAndAwardAchievement(userId, 'perfect_score')
    await addXP(userId, 50, 'quiz_perfect', quizId, 'Идеальный результат на тесте')
  }
}

