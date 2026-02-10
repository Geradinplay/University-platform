# 🚀 Quick Reference: Frontend isProfessor Migration

## TL;DR (Что изменилось?)

### Before
```javascript
// Старая логика
if (userData.role === 'ADMIN') {
  window.location.href = 'index.html';
} else if (userData.role === 'USER') {
  window.location.href = 'professor.html';
}
```

### After
```javascript
// Новая логика (намного проще!)
if (userData.isProfessor) {
  window.location.href = 'professor.html';
} else {
  window.location.href = 'index.html';
}
```

---

## 🎯 API Response (что возвращает сервер)

### /api/auth/me
```json
{
  "id": 1,
  "username": "prof_smith",
  "name": "John Smith",
  "email": "prof@smith.com",
  "role": "USER",           // ← остался для совместимости
  "isBanned": false,
  "isProfessor": true       // ← НОВОЕ! используй это
}
```

---

## 💾 localStorage Keys

| Ключ | Тип | Пример |
|------|-----|--------|
| `jwt` | string | `"eyJhbGc..."` |
| `userId` | number | `1` |
| `username` | string | `"prof_smith"` |
| `name` | string | `"John Smith"` |
| `userEmail` | string | `"prof@smith.com"` |
| `userRole` | string | `"USER"` |
| **`isProfessor`** | boolean | `true` ← НОВОЕ |

---

## 📝 Использование в коде

### Проверка прав доступа
```javascript
// Профессор ли пользователь?
if (localStorage.getItem('isProfessor') === 'true') {
  console.log('Это профессор');
} else {
  console.log('Это ��бычный пользователь');
}
```

### Получение данных
```javascript
const isProfessor = localStorage.getItem('isProfessor') === 'true';
const name = localStorage.getItem('name');
const email = localStorage.getItem('userEmail');
```

### Разные действия по типу
```javascript
if (localStorage.getItem('isProfessor') === 'true') {
  // Показать professor-only функции
  showProfessorPanel();
} else {
  // Показать student функции
  showStudentPanel();
}
```

---

## 🔐 Авторизация Flow

```
1. User registers/logs in
   ↓
2. Backend возвращает JWT token
   ↓
3. Frontend вызывает /api/auth/me с token
   ↓
4. Backend возвращает UserDTO с isProfessor флагом
   ↓
5. Frontend проверяет isProfessor и перенаправляет:
   - isProfessor=true  → /professor.html
   - isProfessor=false → /index.html
   ↓
6. Страница сохраняет isProfessor в localStorage
```

---

## 🧪 Тестирование в консоли

```javascript
// Проверить localStorage
console.log('isProfessor:', localStorage.getItem('isProfessor'));

// Проверить все данные
console.table({
  jwt: localStorage.getItem('jwt')?.substring(0, 20) + '...',
  userId: localStorage.getItem('userId'),
  username: localStorage.getItem('username'),
  name: localStorage.getItem('name'),
  isProfessor: localStorage.getItem('isProfessor')
});
```

---

## 🐛 Отладка

### Проблема: isProfessor не отображается
```javascript
// Проверить в консоли
const token = localStorage.getItem('jwt');
fetch('http://localhost:8080/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('User data:', d));
```

### Проблема: Неправильное перенаправление
```javascript
// Добавить логирование
console.log('Token:', localStorage.getItem('jwt'));
console.log('isProfessor:', localStorage.getItem('isProfessor'));
console.log('Should redirect to:', 
  localStorage.getItem('isProfessor') === 'true' 
    ? 'professor.html' 
    : 'index.html'
);
```

---

## 📋 Checklist для разработчиков

Если добавляете новую функцию на professor.html:

- [ ] Проверьте что пользователь имеет `isProfessor=true`
- [ ] Используйте `localStorage.getItem('isProfessor')`
- [ ] Обработайте случай когда это `false`
- [ ] Добавьте логирование для отладки
- [ ] Протестируйте с обоими типами пользователей

---

## 🔄 Миграция данных

### Что произойдет в БД

#### Users таблица
```sql
-- Было:
ALTER TABLE users ADD professor_id INT;

-- Стало:
ALTER TABLE users ADD is_professor BOOLEAN DEFAULT false;
```

#### Lessons таблица
```sql
-- Было:
ALTER TABLE lessons ADD FOREIGN KEY (professor_id) REFERENCES professors(id);

-- Стало:
ALTER TABLE lessons ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

---

## ⚡ Performance

- ✅ Нет дополнительных API запросов
- ✅ Флаг хранится в памяти (localStorage)
- ✅ Проверка - одна строка кода
- ✅ Быстрее чем проверка role в role-based системе

---

## 🎓 Обучение новых разработчиков

### Как объяснить старым разработчикам:

**Было:** "Проверяй role === 'ADMIN' или role === 'USER'"  
**Стало:** "Проверяй isProfessor флаг - вот и всё!"

```javascript
// Было (сложно)
if (user.role === 'ADMIN') {
  if (user.professorId) {
    // ...
  }
}

// Стало (просто)
if (user.isProfessor) {
  // ...
}
```

---

## 📞 Support

Проблемы? Проверьте:
1. Браузерную консоль (F12 → Console)
2. Network tab для проверки API запросов
3. Что сервер запущен на localhost:8080
4. Что данные корректно сохраняются в localStorage

---

**Last Updated:** 2026-02-10  
**Version:** 1.0  
**Format:** Markdown  
**For:** Frontend Developers

