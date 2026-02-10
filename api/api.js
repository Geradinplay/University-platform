/**
 * API Client for Schedule Project
 * Location: frontend/js/api.js
 * Created: 2026-02-09
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Вспомогательная функция для формирования заголовков.
 * Автоматически добавляет JWT токен из localStorage, если он существует.
 */
const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    const token = localStorage.getItem('jwt');
    console.log('🔑 JWT Token в getHeaders():', token ? '✅ Есть' : '❌ Нет');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('📤 Authorization header добавлен');
    } else {
        console.warn('⚠️ JWT токен не найден в localStorage! Нужно сначала войти в систему.');
    }
    return headers;
};

/**
 * Универсальная обертка для fetch запросов.
 * Реализует поддержку CORS, авторизацию и базовую обработку ошибок.
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Логирование запроса
    if (endpoint.includes('/schedule') || endpoint.includes('/break')) {
        console.log(`🔗 API Request: ${url}`);
    }

    const config = {
        ...options,
        credentials: 'include', // Важно для CORS (отправка cookies/auth)
        headers: {
            ...getHeaders(),
            ...options.headers
        }
    };

    // ДОБАВЛЕНО: Логирование для /api/users запросов
    if (endpoint.includes('/api/users')) {
        console.log('📤 Запрос к', endpoint);
        console.log('📋 Headers:', config.headers);
        const authHeader = config.headers['Authorization'];
        console.log('🔐 Authorization header:', authHeader ? '✅ Присутствует' : '❌ Отсутствует');
        if (authHeader) {
            console.log('🔑 Токен длина:', authHeader.split(' ')[1]?.length || 0, 'символов');
        }
        if (config.body) {
            console.log('📦 Body:', config.body);
        }
    }

    try {
        const response = await fetch(url, config);

        // Обработка успешного удаления (204 No Content)
        if (response.status === 204) return true;

        // Если токен протух или неверный (401)
        if (response.status === 401) {
            console.warn("Сессия истекла. Перенаправление на логин...");
            localStorage.removeItem('jwt');
            // window.location.href = '/login.html'; // Можно раскомментировать при наличии страницы
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // ДОБАВЛЕНО: Логирование полной ошибки
            if (endpoint.includes('/api/users')) {
                console.error('❌ Ошибка при запросе к', endpoint);
                console.error('📊 Статус:', response.status);
                console.error('📦 Ответ сервера:', data);
            }
            throw new Error(data.message || `Ошибка HTTP: ${response.status}`);
        }

        // ДОБАВЛЕНО: Логирование успешного ответа для /api/users
        if (endpoint.includes('/api/users')) {
            console.log('✅ Успешный ответ от', endpoint);
            console.log('📦 Данные ответа:', data);
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
}

// --- АУТЕНТИФИКАЦИЯ ---

export async function login(username, password) {
    const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    if (data.token) {
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('username', data.user?.username || username);
        localStorage.setItem('userId', data.user?.id);
        localStorage.setItem('userRole', data.user?.role);
    }
    return data;
}

export async function register(username, email, password) {
    const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
    if (data.token) {
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('username', data.user?.username || username);
        localStorage.setItem('userId', data.user?.id);
        localStorage.setItem('userRole', data.user?.role);
    }
    return data;
}

export function logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
}

// --- ПРЕПОДАВАТЕЛИ (Professors) ---
// МИГРАЦИЯ: Таблица professors удалена, преподаватели это Users с isProfessor=true

// Получить всех пользователей (для администратора)
// Получает ВСЕ пользователей со сервера, кроме текущего
export const getUsers = async () => {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('⚠️ Нет JWT токена! Нужно сначала войти в систему.');
            return [];
        }

        console.log('📥 Получаю список всех пользователей с /api/users...');
        const allUsers = await apiRequest('/api/users');
        console.log('✅ Получено пользователей с сервера:', allUsers?.length || 0);

        // Получаем ID текущего пользователя
        const currentUserId = localStorage.getItem('userId');
        console.log('🔍 Текущий пользователь ID:', currentUserId);

        // Фильтруем, чтобы исключить текущего пользователя
        const filteredUsers = Array.isArray(allUsers)
            ? allUsers.filter(u => u.id !== currentUserId)
            : [];

        console.log('👥 Пользователей после фильтрации (без текущего):', filteredUsers.length);
        return filteredUsers;
    } catch (err) {
        // Если /api/users недоступен, используем данные из localStorage
        console.warn('⚠️ /api/users недоступен (' + err.message + '). Используем пустой список.');
        return [];
    }
};

// Получить всех преподавателей (это Users с isProfessor=true)
// ВАЖНО: Получаем текущего пользователя и проверяем isProfessor
export const getProfessors = async () => {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('⚠️ Нет JWT токена! Нужно сначала войти в систему.');
            return [];
        }

        console.log('📥 Получаю список всех пользователей для фильтрации профессоров...');

        // Получаем ВСЕ пользователей
        const allUsers = await getUsers();
        console.log('✅ Получено пользователей:', allUsers?.length || 0);

        // Фильтруем только профессоров (isProfessor=true)
        const professors = Array.isArray(allUsers)
            ? allUsers.filter(u => u.isProfessor === true)
            : [];

        console.log('👨‍🏫 Профессоров после фильтрации:', professors.length);
        professors.forEach(p => {
            console.log('  - ' + p.username + ' (' + p.name + ')');
        });
        return professors;
    } catch (err) {
        console.error('❌ Ошибка при получении профессоров:', err.message);
        console.warn('⚠️ Используем данные из localStorage как fallback...');

        // Fallback: если текущий пользователь профессор, возвращаем его
        const isProfessorValue = localStorage.getItem('isProfessor');
        const isProfessor = isProfessorValue === 'true' || isProfessorValue === true;

        const professors = [];
        if (isProfessor) {
            const currentUser = {
                id: localStorage.getItem('userId'),
                username: localStorage.getItem('username'),
                name: localStorage.getItem('name'),
                email: localStorage.getItem('userEmail'),
                role: localStorage.getItem('userRole'),
                isProfessor: true
            };
            console.log('👨‍🏫 Fallback: текущий пользователь профессор');
            if (currentUser.id) {
                professors.push(currentUser);
            }
        }

        return professors;
    }
};

// Создание преподавателя теперь через /api/auth/register с isProfessor=true
// Не используется напрямую, используется через auth регистрацию
export const createProfessor = (data) => apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify({ ...data, isProfessor: true })
});

// Обновить преподавателя (обновляем User с id)
export const updateProfessor = (id, data) => apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
});

// Удалить преподавателя (удаляем User)
export const deleteProfessor = (id) => apiRequest(`/api/users/${id}`, {
    method: 'DELETE'
});

// --- ПРЕДМЕТЫ (Subjects) ---

export const getSubjects = () => apiRequest('/api/subjects');
export const createSubject = (data) => apiRequest('/api/subjects', { method: 'POST', body: JSON.stringify(data) });
export const updateSubject = (id, data) => apiRequest(`/api/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubject = (id) => apiRequest(`/api/subjects/${id}`, { method: 'DELETE' });

// --- АУДИТОРИИ (Classrooms) ---

export const getClassrooms = () => apiRequest('/api/classrooms');
export const createClassroom = (data) => apiRequest('/api/classrooms', { method: 'POST', body: JSON.stringify(data) });
export const updateClassroom = (id, data) => apiRequest(`/api/classrooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteClassroom = (id) => apiRequest(`/api/classrooms/${id}`, { method: 'DELETE' });

// --- ФАКУЛЬТЕТЫ (Faculties) ---

export const getFaculties = () => apiRequest('/api/faculties');
export const getFacultyById = (id) => apiRequest(`/api/faculties/${id}`);
export const createFaculty = (data) => apiRequest('/api/faculties', { method: 'POST', body: JSON.stringify(data) });
export const updateFaculty = (id, data) => apiRequest(`/api/faculties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFaculty = (id) => apiRequest(`/api/faculties/${id}`, { method: 'DELETE' });

// --- РАСПИСАНИЯ (Schedules) ---

export const getSchedules = () => apiRequest('/api/schedules');
export const getScheduleById = (id) => apiRequest(`/api/schedules/${id}`);
export const createSchedule = (data) => apiRequest('/api/schedules', { method: 'POST', body: JSON.stringify(data) });
export const updateSchedule = (id, data) => apiRequest(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSchedule = (id) => apiRequest(`/api/schedules/${id}`, { method: 'DELETE' });

// --- РАСПИСАНИЕ И ЗАНЯТИЯ (Schedule/Lessons) ---

export const getLessonsByScheduleId = (scheduleId) => apiRequest(`/api/schedules/${scheduleId}/lessons`);
export const createLesson = (data) => apiRequest('/api/schedule', { method: 'POST', body: JSON.stringify(data) });
export const updateLessonDay = (id, data) => apiRequest(`/api/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteLesson = (id) => apiRequest(`/api/schedule/${id}`, { method: 'DELETE' });

// --- ПЕРЕРЫВЫ (Breaks) ---

export const getBreaks = (scheduleId) => apiRequest(`/api/schedules/${scheduleId}/breaks`);
export const createBreak = (data) => apiRequest('/api/break', { method: 'POST', body: JSON.stringify(data) });
export const updateBreak = (id, data) => apiRequest(`/api/break/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBreak = (id) => apiRequest(`/api/break/${id}`, { method: 'DELETE' });