# 📚 Professor Management Migration Guide

**Дата:** 2026-02-10  
**Статус:** ✅ ОБНОВЛЕНО  
**Версия:** 2.0

---

## 🔄 Что изменилось?

### Было (старая система)
```
User opens admin panel
    ↓
Admin clicks "Add Professor"
    ↓
Admin enters professor name
    ↓
POST /api/professors { name: "John Smith" }
    ↓
New row in "professors" table
    ↓
Professor appears in list
```

### Стало (новая система с isProfessor флагом)
```
Admin opens admin panel
    ↓
Admin clicks "Add Professor"
    ↓
Admin enters:
  - username (логин)
  - name (полное имя)
  - email
  - password
    ↓
POST /api/auth/register {
  username: "prof_john",
  name: "John Smith",
  email: "john@example.com",
  password: "SecurePass123",
  isProfessor: true
}
    ↓
New User created in "users" table with isProfessor=true
    ↓
Professor appears in list
```

---

## 📝 Как добавить преподавателя?

### Способ 1: Через интерфейс (если есть админ панель)
```javascript
// Код из src/js/main.js
window.addProfessor = async function() {
    // Запрашивает данные у админа через промпты:
    // 1. username (имя пользователя/логин)
    // 2. name (полное имя)
    // 3. email
    // 4. password
    
    // Затем отправляет на:
    // POST /api/auth/register {
    //   username, name, email, password, isProfessor: true
    // }
}
```

### Способ 2: Через Postman/curl
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_john",
    "name": "John Smith",
    "email": "john@smith.com",
    "password": "SecurePass123",
    "isProfessor": true
  }'
```

### Способ 3: Через фронтенд регистрацию
```javascript
// Если у вас есть UI с флагом isProfessor, можно регистрировать
// преподавателя через обычную форму регистрации,
// но с isProfessor=true
POST /api/auth/register {
  username: "prof_john",
  name: "John Smith",
  email: "john@smith.com",
  password: "SecurePass123",
  isProfessor: true
}
```

---

## 📊 API Endpoints

### Получить всех преподавателей
```javascript
// СТАРО (удалено):
GET /api/professors

// НОВО:
GET /api/users/professors
// Возвращает: массив Users с isProfessor=true
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "prof_john",
    "name": "John Smith",
    "email": "john@smith.com",
    "role": "USER",
    "isProfessor": true,
    "isBanned": false
  },
  {
    "id": 2,
    "username": "prof_jane",
    "name": "Jane Doe",
    "email": "jane@doe.com",
    "role": "USER",
    "isProfessor": true,
    "isBanned": false
  }
]
```

### Добавить преподавателя
```javascript
// СТАРО (удалено):
POST /api/professors
{ "name": "John Smith" }

// НОВО:
POST /api/auth/register
{
  "username": "prof_john",
  "name": "John Smith",
  "email": "john@smith.com",
  "password": "SecurePass123",
  "isProfessor": true  // ← НОВОЕ!
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "username": "prof_john",
  "name": "John Smith",
  "email": "john@smith.com",
  "role": "USER",
  "isProfessor": true,
  "isBanned": false
}
```

### Обновить преподавателя
```javascript
// СТАРО (удалено):
PUT /api/professors/1
{ "name": "Updated Name" }

// НОВО:
PUT /api/users/1
{
  "name": "Updated Name",
  "email": "new@email.com",
  "isProfessor": true
}
```

### Удалить преподавателя
```javascript
// СТАРО (удалено):
DELETE /api/professors/1

// НОВО:
DELETE /api/users/1
// Удаляет пользователя (который был преподавателем)
```

---

## 💾 Database Changes

### Users таблица
```sql
-- ДОБАВЛЕНО:
ALTER TABLE users ADD COLUMN is_professor BOOLEAN DEFAULT false;

-- РЕЗУЛЬТАТ: 
CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(50),
  is_banned BOOLEAN DEFAULT false,
  is_professor BOOLEAN DEFAULT false,  -- ← НОВОЕ!
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Professors таблица
```sql
-- УДАЛЕНО:
DROP TABLE professors;  -- Эта таблица больше не используется
```

---

## 🔄 Код в main.js

### Старый код (удален)
```javascript
window.addProfessor = async function() {
    const name = document.getElementById('newProfessorName').value.trim();
    if (!name) {
        alert('Введите имя преподавателя!');
        return;
    }
    try {
        await createProfessor({ name });  // ← /api/professors
        document.getElementById('newProfessorName').value = '';
        alert('Преподаватель добавлен!');
        loadProfessorList(0);
        const professors = await getProfessors();
        populateSelect('teacherSelect', professors, 'name');
    } catch (err) {
        alert('Ошибка при добавлении преподавателя');
    }
};
```

### Новый код (обновлено)
```javascript
window.addProfessor = async function() {
    // Запрашивает данные через промпты
    const username = prompt('Введите username:');
    const name = prompt('Введите полное имя:');
    const email = prompt('Введите email:');
    const password = prompt('Введите пароль:');
    
    try {
        // Отправляет на /api/auth/register с isProfessor=true
        const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, name, email, password, isProfessor: true 
            })
        });
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.isProfessor) {
                alert(`Преподаватель "${name}" успешно добавлен!`);
                // Обновляем список
                loadProfessorList?.(0);
                const professors = await getProfessors();
                populateSelect('teacherSelect', professors, 'name');
            }
        }
    } catch (err) {
        alert('Ошибка при добавлении преподавателя: ' + err.message);
    }
};
```

---

## 🔗 Связанные изменения в api.js

### Было
```javascript
export const getProfessors = () => apiRequest('/api/professors');
export const createProfessor = (data) => apiRequest('/api/professors', { 
    method: 'POST', 
    body: JSON.stringify(data) 
});
export const updateProfessor = (id, data) => apiRequest(`/api/professors/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
});
export const deleteProfessor = (id) => apiRequest(`/api/professors/${id}`, { 
    method: 'DELETE' 
});
```

### Стало
```javascript
export const getProfessors = () => apiRequest('/api/users/professors');
// Возвращает Users с isProfessor=true

export const createProfessor = (data) => apiRequest('/api/users', { 
    method: 'POST', 
    body: JSON.stringify({ ...data, isProfessor: true }) 
});

export const updateProfessor = (id, data) => apiRequest(`/api/users/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
});

export const deleteProfessor = (id) => apiRequest(`/api/users/${id}`, { 
    method: 'DELETE' 
});
```

---

## 📋 Чек-лист для backend

Backend должен поддерживать:

- [ ] `POST /api/auth/register` с параметром `isProfessor` (по умолчанию false)
- [ ] `GET /api/users/professors` - получить всех Users с isProfessor=true
- [ ] `POST /api/users` - создать пользователя (для fallback если нужно)
- [ ] `PUT /api/users/{id}` - обновить пользователя (включая isProfessor)
- [ ] `DELETE /api/users/{id}` - удалить пользователя
- [ ] Миграция БД: добавить колонку `is_professor` в `users`
- [ ] Миграция БД: перенести данные из `professors` в `users` с isProfessor=true (если нужно)
- [ ] Миграция БД: удалить таблицу `professors`

---

## 🧪 Тестирование

### Test 1: Добавить преподавателя через интерфейс
```javascript
1. Открыть admin панель
2. Нажать "Add Professor"
3. Ввести:
   - username: "prof_test"
   - name: "Test Professor"
   - email: "prof@test.com"
   - password: "TestPass123"
4. Ожидаемо:
   - Преподаватель добавлен
   - Он появляется в списке
   - isProfessor = true в БД
```

### Test 2: Получить список преподавателей
```javascript
const professors = await getProfessors();
// Должны вернуться только Users с isProfessor=true
console.log(professors);
// [
//   { id: 1, username: "prof_john", name: "John Smith", isProfessor: true },
//   { id: 2, username: "prof_jane", name: "Jane Doe", isProfessor: true }
// ]
```

### Test 3: Удалить преподавателя
```javascript
await deleteProfessor(1);
// Пользователь удалён из БД
const professors = await getProfessors();
// Преподаватель больше в списке не появляется
```

---

## ⚠️ Важные моменты

### Отличия от старой системы

| Аспект | Было | Стало |
|--------|------|-------|
| Таблица | professors | users |
| Создание | POST /api/professors {name} | POST /api/auth/register {username, name, email, password, isProfessor} |
| Данные | Только имя | Полная информация пользователя |
| Аутентификация | Нет | Преподаватель может логиниться |
| Удаление | DELETE /api/professors/1 | DELETE /api/users/1 |

### Преимущества новой системы

✅ Преподаватель это полноценный User  
✅ Может логиниться в систему  
✅ Имеет email и password  
✅ Можно отследить активность  
✅ Единая таблица users вместо разных таблиц  
✅ Проще управлять разрешениями  

---

## 📞 Troubleshooting

### Проблема: GET /api/professors возвращает 404
**Причина:** Endpoint удалён, используется новый `/api/users/professors`  
**Решение:** Обновить вызовы в коде на `getProfessors()`

### Проблема: POST /api/professors не работает
**Причина:** Endpoint удалён  
**Решение:** Использовать `POST /api/auth/register` с `isProfessor: true`

### Проблема: Преподаватель не появляется в списке
**Причина:** `isProfessor=false` в БД  
**Решение:** Проверить что `isProfessor: true` отправлен на сервер

### Проблема: Не могу удалить преподавателя
**Причина:** Может быть связанные записи в других таблицах  
**Решение:** Удалить уроки/расписания где он преподавател��, затем удалить пользователя

---

## 🎓 Обучение

### Для разработчиков

1. Понять что таблица professors удалена
2. Преподаватель это User с isProfessor=true
3. Используются endpoints `/api/users/*` вместо `/api/professors/*`
4. Backend должен поддерживать `isProfessor` параметр

### Для QA

1. Добавить преподавателя через интерфейс
2. Проверить что он появляется в списке
3. Проверить что он может логиниться
4. Проверить что можно обновить его данные
5. Проверить что можно удалить
6. Проверить что БД правильно обновляется

---

## 📚 Связанные документы

- `PROFESSOR_FLAG_REPORT.md` - Backend миграция
- `FRONTEND_PROFESSOR_FLAG_UPDATE.md` - Frontend миграция
- `COMPLETE_PROFESSOR_TO_FLAG_MIGRATION.md` - Полный отчет

---

**Версия:** 2.0  
**Дата:** 2026-02-10  
**Статус:** ✅ ОБНОВЛЕНО  
**Автор:** Geradine

