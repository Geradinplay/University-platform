# 📋 UI Update: Преподаватели как Users с isProfessor флагом

**Дата:** 2026-02-10  
**Статус:** ✅ ГОТОВО  
**Версия:** 2.0

---

## 🎯 Что изменилось в UI?

Теперь преподаватели отображаются как обычные пользователи (Users) с флагом `isProfessor=true`.

### Было
```
Преподаватель - это отдельная сущность в таблице "professors"
Отображалось только имя (name)
```

### Стало
```
Преподаватель - это User с isProfessor=true
Отображается: username (полужирный), полное имя, email
```

---

## 📊 Где отображаются преподаватели?

### 1. Список преподавателей (Professor List)
**Файл:** `src/js/main.js` → `loadProfessorList()`

**Было:**
```
[Иван Петров] [Удалить]
```

**Стало:**
```
prof_ivan_petrov (полужирный)
Иван Петров (ivan@example.com)
[Изменить] [Удалить]
```

#### Отображаемые данные:
- `username` - полужирный (16px)
- `name` - обычный (14px)
- `email` - серый, маленький (12px)

#### Кнопки:
- **Изменить** - изменить полное имя
- **Удалить** - удалить преподавателя из системы

### 2. Выпадающий список преподавателей (Teacher Select)
**Файл:** `src/js/main.js` → DOMContentLoaded

**Было:**
```
<select id="teacherSelect">
  <option value="">Выберите преподавателя</option>
  <option value="1">Иван Петров</option>
  <option value="2">Мария Иванова</option>
</select>
```

**Стало:**
```
<select id="teacherSelect">
  <option value="">Выберите преподавателя</option>
  <option value="1">prof_ivan_petrov</option>
  <option value="2">prof_maria_ivanova</option>
</select>
```

#### Отображаемые данные:
- `username` (логин пользователя)
- `value` = `id` (ID пользователя в БД)

---

## 🔧 Код изменений

### В `loadProfessorList()` - строка 979

**Старый код:**
```javascript
const nameSpan = document.createElement('span');
nameSpan.textContent = p.name;
// Просто отображал имя
```

**Новый код:**
```javascript
// Username (полужирный)
const usernameSpan = document.createElement('span');
usernameSpan.textContent = p.username || p.name;
usernameSpan.style.fontWeight = 'bold';
usernameSpan.style.fontSize = '16px';

// Полное имя
const nameSpan = document.createElement('span');
nameSpan.textContent = p.name;
nameSpan.style.color = '#555';

// Email
const emailSpan = document.createElement('span');
emailSpan.textContent = p.email ? `(${p.email})` : '';
emailSpan.style.color = '#999';
emailSpan.style.fontSize = '12px';
```

### В DOMContentLoaded - строка 1162

**Было:**
```javascript
populateSelect('teacherSelect', professors, 'name');
```

**Стало:**
```javascript
populateSelect('teacherSelect', professors, 'username');
```

---

## 📱 Визуальное сравнение

### Карточка преподавателя в списке

#### ДО (старая система):
```
┌─────────────────────────────┐
│ Иван Петров    [Удалить]    │
└─────────────────────────────┘
```

#### ПОСЛЕ (новая система):
```
┌─────────────────────────────────────────────┐
│ prof_ivan_petrov (полужирный)              │
│ Иван Петров (ivan.petrov@university.edu)  │
│ [Изменить] [Удалить]                       │
└─────────────────────────────────────────────┘
```

### Dropdown селект

#### ДО (старая система):
```
┌──────────────────────────┐
│ Выберите преподавателя   │
├──────────────────────────┤
│ Иван Петров              │
│ Мария Иванова            │
└──────────────────────────┘
```

#### ПОСЛЕ (новая система):
```
┌──────────────────────────┐
│ Выберите преподавателя   │
├──────────────────────────┤
│ prof_ivan_petrov         │
│ prof_maria_ivanova       │
└──────────────────────────┘
```

---

## 💾 Data структура

### Старая система (professors таблица)
```json
{
  "id": 1,
  "name": "Иван Петров"
}
```

### Новая система (users таблица с isProfessor=true)
```json
{
  "id": 1,
  "username": "prof_ivan_petrov",
  "name": "Иван Петров",
  "email": "ivan.petrov@university.edu",
  "role": "USER",
  "isProfessor": true,
  "isBanned": false
}
```

---

## 🎯 Преимущества новой системы

✅ **Полная информация:** Видны username, имя, email  
✅ **Уникальность:** Username уникален и служит идентификатором  
✅ **Аутентификация:** Преподаватель может логиниться в систему  
✅ **Единая таблица:** Нет отдельной таблицы professors  
✅ **Проще управлять:** Все пользователи в одном месте  
✅ **Лучше видимость:** Больше информации в списке  

---

## 🔄 API Endpoints

### Получить всех преподавателей
```javascript
// Старо:
GET /api/professors

// Ново:
GET /api/users/professors
// Возвращает: Users с isProfessor=true
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "prof_ivan_petrov",
    "name": "Иван Петров",
    "email": "ivan.petrov@university.edu",
    "role": "USER",
    "isProfessor": true
  },
  {
    "id": 2,
    "username": "prof_maria_ivanova",
    "name": "Мария Иванова",
    "email": "maria.ivanova@university.edu",
    "role": "USER",
    "isProfessor": true
  }
]
```

---

## 🧪 Тестирование

### Test 1: Просмотр списка преподавателей
```
1. Откройте админ панель (index.html)
2. Перейдите на вкладку "Преподаватели"
3. Посмотрите список
4. Ожидаемо:
   - Каждый преподаватель показан с:
     * username (полужирный)
     * полным именем (name)
     * email
   - Есть кнопки "Изменить" и "Удалить"
```

### Test 2: Выбор преподавателя в dropdown
```
1. Откройте вкладку "Создать занятие"
2. Посмотрите dropdown "Выберите преподавателя"
3. Кликните на dropdown
4. Ожидаемо:
   - Список показывает usernames преподавателей
   - Например: prof_ivan_petrov, prof_maria_ivanova
```

### Test 3: Добавить нового преподавателя
```
1. Нажмите "Add Professor"
2. Заполните данные
3. Нажмите Enter
4. Ожидаемо:
   - Преподаватель добавлен в список с полной информацией
   - Он также появляется в dropdown
   - Отображается его username, name, email
```

---

## 🐛 Troubleshooting

### Проблема: Преподаватели не видны в списке
**Причина:** API endpoint не работает  
**Решение:** Проверьте что сервер работает и `/api/users/professors` доступен

### Проблема: В dropdown показывается только ID вместо username
**Причина:** Data структура неправильная  
**Решение:** Убедитесь что API возвращает `username` поле

### Проблема: Email не отображается
**Причина:** Email может быть пустой  
**Решение:** Заполните email при добавлении преподавателя

---

## 📝 Чек-лист обновлений

- [x] Функция `loadProfessorList()` обновлена
- [x] Отображение username, name, email в списке
- [x] Добавлены кнопки "Изменить" и "Удалить"
- [x] Dropdown селект обновлён на username
- [x] Стили улучшены (bold username, серый email)
- [x] API endpoints обновлены
- [x] Тесты подготовлены

---

## 📚 Связанные файлы

- `src/js/main.js` - основные функции
- `src/js/utils/selectPopulator.js` - функция для заполнения dropdown
- `api/api.js` - API endpoints
- `PROFESSOR_MANAGEMENT_MIGRATION.md` - подробная документация

---

**Версия:** 2.0  
**Дата:** 2026-02-10  
**Статус:** ✅ ГОТОВО К ИСПОЛЬЗОВАНИЮ  
**Автор:** Geradine

