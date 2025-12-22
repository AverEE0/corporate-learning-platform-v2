-- Создание таблицы достижений
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  type VARCHAR(50) NOT NULL, -- 'course_completed', 'streak', 'perfect_score', 'first_course', etc.
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы пользовательских достижений
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress INTEGER DEFAULT 100, -- для прогрессивных достижений (0-100)
  UNIQUE(user_id, achievement_id)
);

-- Создание таблицы опыта пользователей (XP)
CREATE TABLE IF NOT EXISTS user_xp (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы истории начисления XP
CREATE TABLE IF NOT EXISTS xp_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'course_completed', 'lesson_completed', 'quiz_perfect', etc.
  source_id INTEGER, -- ID источника (course_id, lesson_id, etc.)
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_created_at ON xp_history(created_at);

-- Вставка базовых достижений
INSERT INTO achievements (code, name, description, icon, type, points) VALUES
  ('first_course', 'Первый шаг', 'Завершите свой первый курс', '🎯', 'course_completed', 50),
  ('course_master', 'Мастер курсов', 'Завершите 10 курсов', '🏆', 'course_completed', 200),
  ('perfect_score', 'Идеальный результат', 'Получите 100% на тесте', '⭐', 'quiz_perfect', 100),
  ('streak_7', 'Неделя подряд', 'Учитесь 7 дней подряд', '🔥', 'streak', 150),
  ('streak_30', 'Месяц подряд', 'Учитесь 30 дней подряд', '💎', 'streak', 500),
  ('speed_learner', 'Быстрый ученик', 'Завершите курс за один день', '⚡', 'course_completed', 100),
  ('early_bird', 'Ранняя пташка', 'Начните обучение до 8 утра', '🌅', 'activity', 50),
  ('night_owl', 'Ночная сова', 'Учитесь после 22:00', '🦉', 'activity', 50),
  ('quiz_master', 'Мастер тестов', 'Пройдите 50 тестов', '📝', 'quiz_completed', 300),
  ('social_learner', 'Социальный ученик', 'Оставьте 10 комментариев', '💬', 'social', 100)
ON CONFLICT (code) DO NOTHING;

