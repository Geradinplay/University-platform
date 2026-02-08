const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к файлу базы данных SQLite
// В реальном приложении путь может быть другим или использоваться переменные окружения
const DB_PATH = path.resolve(__dirname, 'schedule.db');

let db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
        // Создание таблицы, если она не существует
        db.run(`CREATE TABLE IF NOT EXISTS lessons (
            id TEXT PRIMARY KEY,
            title TEXT,
            info TEXT,
            time TEXT,
            day TEXT
        )`, (err) => {
            if (err) {
                console.error('Ошибка при создании таблицы lessons:', err.message);
            } else {
                console.log('Таблица lessons проверена/создана.');
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS breaks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id TEXT,
            duration INTEGER,
            day TEXT,
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                console.error('Ошибка при создании таблицы breaks:', err.message);
            } else {
                console.log('Таблица breaks проверена/создана.');
            }
        });
    }
});

// Экспортируем объект базы данных для использования в других серверных модулях
module.exports = db;

/*
    Пример использования (этот код не будет работать в браузере):
    
    // В другом файле Node.js (например, server.js)
    const db = require('./db');

    // Добавление нового занятия
    db.run(`INSERT INTO lessons (id, title, info, time, day) VALUES (?, ?, ?, ?, ?)`,
        ['ID123', 'Математика', 'Иванов, ауд. 101', '10:00-11:00', 'Понедельник'],
        function(err) {
            if (err) {
                console.error('Ошибка при добавлении занятия:', err.message);
            } else {
                console.log(`Занятие добавлено с ID: ${this.lastID}`);
            }
        }
    );

    // Получение всех занятий
    db.all(`SELECT * FROM lessons`, [], (err, rows) => {
        if (err) {
            console.error('Ошибка при получении занятий:', err.message);
        } else {
            console.log('Все занятия:', rows);
        }
    });
*/
