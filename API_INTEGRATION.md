# 🔗 Интеграция с Spring Boot API

## 📋 Обзор

Фронтенд приложение полностью интегрировано с Spring Boot сервером через REST API.

**Базовый URL сервера:** `http://localhost:8080`

## ✅ Что уже реализовано

### 1. **Аутентификация** (`api/api.js`)

#### Регистрация
```javascript
import { register } from '../../api/api.js';

const result = await register(username, email, password);
// Автоматически сохраняет JWT токен в localStorage
```

**API Endpoint:** `POST /api/auth/register`
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER",
    "isBanned": false
  }
}
```

#### Вход
```javascript
import { login } from '../../api/api.js';

const result = await login(username, password);
```

**API Endpoint:** `POST /api/auth/login`

### 2. **Управление данными**

#### Предметы (Subjects)
```javascript
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../api/api.js';

// Получить все
const subjects = await getSubjects();

// Создать
await createSubject({ name: "Математика" });

// Обновить
await updateSubject(id, { name: "Высшая математика" });

// Удалить
await deleteSubject(id);
```

#### Преподаватели (Professors)
```javascript
import { getProfessors, createProfessor, updateProfessor, deleteProfessor } from '../../api/api.js';
```

#### Аудитории (Classrooms)
```javascript
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom } from '../../api/api.js';
```

#### Расписания (Schedules)
```javascript
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../api/api.js';

// Получить все расписания
const schedules = await getSchedules();

// Создать новое расписание
await createSchedule({ 
  name: "Расписание 1 группы", 
  facultyId: 1 
});
```

### 3. **Занятия (Lessons)**

#### Создание занятия
```javascript
import { createLesson } from '../../api/api.js';

await createLesson({
  startTime: "09:00",
  endTime: "10:30",
  day: 1,
  subjectId: 1,
  professorId: 1,
  classroomId: 1,
  scheduleId: 1  // ID текущего расписания
});
```

**API Endpoint:** `POST /api/schedule`

**Response:**
```json
{
  "id": 1,
  "startTime": "09:00",
  "endTime": "10:30",
  "day": 1,
  "subject": { "id": 1, "name": "Математика" },
  "professor": { "id": 1, "name": "Иван Петров" },
  "classroom": { "id": 1, "number": "101" }
}
```

#### Обновление занятия
```javascript
import { updateLessonDay } from '../../api/api.js';

await updateLessonDay(lessonId, {
  startTime: "10:00",
  endTime: "11:30",
  day: 2,
  subjectId: 2,
  professorId: 2,
  classroomId: 2,
  scheduleId: 1
});
```

**API Endpoint:** `PUT /api/schedule/{id}`

### 4. **Перерывы (Breaks)**

#### Создание перерыва
```javascript
import { createBreak } from '../../api/api.js';

await createBreak({
  startTime: "10:30",
  endTime: "10:45",
  day: 1,
  duration: 15,
  positionAfterLessonId: 1,  // После какого занятия
  scheduleId: 1
});
```

**API Endpoint:** `POST /api/break`

## 🔧 Настройка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Запуск сервера Spring Boot
Убедитесь, что ваш Spring Boot сервер запущен на `http://localhost:8080`

### 3. Запуск фронтенда
```bash
npm start
```
Или откройте `public/index.html` напрямую в браузере.

## 🔐 Аутентификация с JWT

Все запросы автоматически включают JWT токен из `localStorage`:

```javascript
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    const token = localStorage.getItem('jwt');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};
```

### Сохраненные данные в localStorage:
- `jwt` - JWT токен
- `username` - Имя пользователя
- `userId` - ID пользователя
- `userRole` - Роль (USER/ADMIN)
- `currentScheduleId` - ID текущего расписания (по умолчанию 1)

## 📌 Важные моменты

### 1. scheduleId
Все занятия и перерывы связаны с конкретным расписанием через `scheduleId`. По умолчанию используется ID = 1:

```javascript
scheduleId: Number(localStorage.getItem('currentScheduleId') || 1)
```

Чтобы работать с другим расписанием:
```javascript
localStorage.setItem('currentScheduleId', '2');
```

### 2. Формат времени
Время передается в формате `HH:MM` (24-часовой):
- `"09:00"` ✅
- `"9:00"` ❌ (будет преобразовано в "09:00")

### 3. День недели
`day` - число от 0 до 7:
- `0` - Буфер (карточки вне расписания)
- `1` - Понедельник
- `2` - Вторник
- ...
- `7` - Воскресенье

### 4. CORS
Убедитесь, что Spring Boot сервер настроен для CORS:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:*", "http://127.0.0.1:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## 🐛 Отладка

### Проверка API запросов
Откройте DevTools (F12) → Network → фильтр XHR/Fetch

### Логирование
API клиент логирует все ошибки:
```javascript
console.error(`API Error [${endpoint}]:`, error.message);
```

### Проверка авторизации
```javascript
// В консоли браузера:
console.log(localStorage.getItem('jwt'));
console.log(localStorage.getItem('userRole'));
```

## 📚 Структура файлов

```
api/
  api.js          - Реальный API клиент (используется)
  mockApi.js      - Mock API (НЕ используется, можно удалить)

src/js/
  main.js                      - Основная логика
  auth/
    LoginRegisterPage.js       - Аутентификация
  handlers/
    lessonFormHandler.js       - Создание занятий
    dragDropHandler.js         - Drag & Drop с обновлением на сервере
    contextMenuHandler.js      - Контекстное меню (удаление)
```

## ✨ Готовые функции

Все функции в `api/api.js` готовы к использованию:

### Аутентификация
- ✅ `login(username, password)`
- ✅ `register(username, email, password)`
- ✅ `logout()`

### Предметы
- ✅ `getSubjects()`
- ✅ `createSubject(data)`
- ✅ `updateSubject(id, data)`
- ✅ `deleteSubject(id)`

### Преподаватели
- ✅ `getProfessors()`
- ✅ `createProfessor(data)`
- ✅ `updateProfessor(id, data)`
- ✅ `deleteProfessor(id)`

### Аудитории
- ✅ `getClassrooms()`
- ✅ `createClassroom(data)`
- ✅ `updateClassroom(id, data)`
- ✅ `deleteClassroom(id)`

### Расписания
- ✅ `getSchedules()`
- ✅ `getScheduleById(id)`
- ✅ `createSchedule(data)`
- ✅ `updateSchedule(id, data)`
- ✅ `deleteSchedule(id)`

### Занятия
- ✅ `getSchedule()` - получить все занятия
- ✅ `createLesson(data)`
- ✅ `updateLessonDay(id, data)`
- ✅ `deleteLesson(id)`

### Перерывы
- ✅ `getBreaks()`
- ✅ `createBreak(data)`
- ✅ `updateBreak(id, data)`
- ✅ `deleteBreak(id)`

## 🚀 Быстрый старт

1. **Запустите Spring Boot сервер:**
   ```bash
   cd your-spring-boot-project
   ./mvnw spring-boot:run
   ```

2. **Откройте фронтенд:**
   - Откройте `public/auth.html` для входа/регистрации
   - После входа будет редирект на `public/index.html`

3. **Начните работать:**
   - Добавьте предметы, преподавателей, аудитории
   - Создайте занятия через форму
   - Перетаскивайте карточки между днями
   - Всё автоматически сохраняется на сервере! 🎉

## 📝 Примечания

- ❌ **mockApi.js НЕ используется** - весь код работает с реальным API
- ✅ Все запросы идут на `http://localhost:8080/api/*`
- ✅ JWT токен автоматически добавляется ко всем запросам
- ✅ Drag & Drop автоматически обновляет данные на сервере
- ✅ При ошибках сервера показываются alert с описанием
- ✅ **ИСПРАВЛЕНО (2026-02-09):** Баг с дублированием перерывов при drag & drop (см. [BUGFIX_DOUBLE_BREAKS.md](BUGFIX_DOUBLE_BREAKS.md))

## 🐛 Известные исправления

### ✅ Дублирование перерывов (Исправлено 2026-02-09)
**Проблема:** При переносе занятия из буфера в день с включенной опцией "Автоматические перерывы" иногда создавалось 2 перерыва вместо 1.

**Решение:** Добавлена проверка существующих перерывов ПЕРЕД вставкой элемента и финальная проверка перед добавлением в DOM.

**Подробнее:** См. файл [BUGFIX_DOUBLE_BREAKS.md](BUGFIX_DOUBLE_BREAKS.md)

---

**Дата создания:** 2026-02-09  
**Версия API:** Spring Boot 3.x + Spring Security 6.x

