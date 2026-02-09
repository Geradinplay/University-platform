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
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * Универсальная обертка для fetch запросов.
 * Реализует поддержку CORS, авторизацию и базовую обработку ошибок.
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        ...options,
        credentials: 'include', // Важно для CORS (отправка cookies/auth)
        headers: {
            ...getHeaders(),
            ...options.headers
        }
    };

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
            throw new Error(data.message || `Ошибка HTTP: ${response.status}`);
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

export const getProfessors = () => apiRequest('/api/professors');
export const createProfessor = (data) => apiRequest('/api/professors', { method: 'POST', body: JSON.stringify(data) });
export const updateProfessor = (id, data) => apiRequest(`/api/professors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProfessor = (id) => apiRequest(`/api/professors/${id}`, { method: 'DELETE' });

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

// --- РАСПИСАНИЯ (Schedules) ---

export const getSchedules = () => apiRequest('/api/schedules');
export const getScheduleById = (id) => apiRequest(`/api/schedules/${id}`);
export const createSchedule = (data) => apiRequest('/api/schedules', { method: 'POST', body: JSON.stringify(data) });
export const updateSchedule = (id, data) => apiRequest(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSchedule = (id) => apiRequest(`/api/schedules/${id}`, { method: 'DELETE' });

// --- РАСПИСАНИЕ И ЗАНЯТИЯ (Schedule/Lessons) ---

export const getSchedule = () => apiRequest('/api/schedule');
export const createLesson = (data) => apiRequest('/api/schedule', { method: 'POST', body: JSON.stringify(data) });
export const updateLessonDay = (id, data) => apiRequest(`/api/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteLesson = (id) => apiRequest(`/api/schedule/${id}`, { method: 'DELETE' });

// --- ПЕРЕРЫВЫ (Breaks) ---

export const getBreaks = () => apiRequest('/api/break');
export const createBreak = (data) => apiRequest('/api/break', { method: 'POST', body: JSON.stringify(data) });
export const updateBreak = (id, data) => apiRequest(`/api/break/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBreak = (id) => apiRequest(`/api/break/${id}`, { method: 'DELETE' });