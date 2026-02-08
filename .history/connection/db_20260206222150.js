const { Pool } = require('pg');

// Настройки подключения к базе данных PostgreSQL
// Рекомендуется использовать переменные окружения для чувствительных данных
const pool = new Pool({
    user: process.env.DB_USER || 'dc',       // Имя пользователя вашей базы данных PostgreSQL
    host: process.env.DB_HOST || 'localhost',                 // Хост вашей базы данных (например, 'localhost' или IP-адрес)
    database: process.env.DB_NAME || 'dc',           // Имя вашей базы данных
    password: process.env.DB_PASSWORD || '`krf2005', // Пароль пользователя базы данных
    port: process.env.DB_PORT || 5432,                        // Порт PostgreSQL по умолчанию 5432
});

pool.on('error', (err) => {
    console.error('Неожиданная ошибка на клиенте БД PostgreSQL', err);
    process.exit(-1);
});

// Проверка подключения и создание таблиц
pool.connect()
    .then(client => {
        console.log('Подключено к базе данных PostgreSQL.');

        // Создание таблицы lessons, если она не существует (PostgreSQL синтаксис)
        return client.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                info TEXT,
                time TEXT NOT NULL,
                day TEXT NOT NULL
            );
        `)
        .then(() => {
            console.log('Таблица lessons проверена/создана.');
            // Создание таблицы breaks, если она не существует (PostgreSQL синтаксис)
            return client.query(`
                CREATE TABLE IF NOT EXISTS breaks (
                    id SERIAL PRIMARY KEY,
                    lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
                    duration INTEGER NOT NULL,
                    day TEXT NOT NULL
                );
            `);
        })
        .then(() => {
            console.log('Таблица breaks проверена/создана.');
            client.release(); // Освобождаем клиент обратно в пул
        });
    })
    .catch(err => {
        console.error('Ошибка при подключении или создании таблиц PostgreSQL:', err.message);
    });


// Экспортируем пул для использования в других серверных модулях
module.exports = pool;

/*
    Пример использования (этот код не будет работать в браузере):
    
    // В другом файле Node.js (например, server.js)
    const db = require('./connection/db'); // Путь к db.js

    // Добавление нового занятия
    async function addLesson(id, title, info, time, day) {
        try {
            const res = await db.query(
                `INSERT INTO lessons (id, title, info, time, day) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [id, title, info, time, day]
            );
            console.log(`Занятие добавлено с ID: ${res.rows[0].id}`);
        } catch (err) {
            console.error('Ошибка при добавлении занятия:', err.message);
        }
    }

    // Получение всех занятий
    async function getAllLessons() {
        try {
            const res = await db.query(`SELECT * FROM lessons`);
            console.log('Все занятия:', res.rows);
            return res.rows;
        } catch (err) {
            console.error('Ошибка при получении занятий:', err.message);
            return [];
        }
    }

    // Пример вызова функций (только для серверной части Node.js)
    // addLesson('ID' + Date.now(), 'История', 'Смирнова, ауд. 205', '11:00-12:00', 'Вторник');
    // getAllLessons();
*/
