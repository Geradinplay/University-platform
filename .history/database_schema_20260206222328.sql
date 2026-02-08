-- Скрипт для создания таблиц в базе данных PostgreSQL

-- Таблица для хранения занятий (уроков)
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,            -- Уникальный идентификатор занятия, например "ID" + timestamp
    title TEXT NOT NULL,            -- Название занятия (например, "Физика")
    info TEXT,                      -- Дополнительная информация (преподаватель, аудитория)
    time TEXT NOT NULL,             -- Время занятия в формате "ЧЧ:ММ-ЧЧ:ММ"
    day TEXT NOT NULL               -- День недели (например, "Понедельник")
);

-- Таблица для хранения перерывов
-- Связана с таблицей lessons через lesson_id, перерыв следует за определенным занятием
CREATE TABLE IF NOT EXISTS breaks (
    id SERIAL PRIMARY KEY,          -- Автоинкрементный уникальный идентификатор перерыва
    lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE, -- ID занятия, после которого идет перерыв
                                                            -- ON DELETE CASCADE: если занятие удаляется, перерыв тоже удаляется
    duration INTEGER NOT NULL,      -- Длительность перерыва в минутах
    day TEXT NOT NULL               -- День недели, к которому относится перерыв
);

-- Дополнительные индексы для оптимизации запросов (по желанию)
CREATE INDEX IF NOT EXISTS idx_lessons_day ON lessons (day);
CREATE INDEX IF NOT EXISTS idx_breaks_day ON breaks (day);
CREATE INDEX IF NOT EXISTS idx_breaks_lesson_id ON breaks (lesson_id);
