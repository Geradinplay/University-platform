// Этот файл остается без изменений, как реальный API клиент.
// В настоящее время используется mockApi.js
const API_BASE_URL = 'http://localhost:8080'; // Базовый URL без /api

export async function getProfessors() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/professors`); // Добавили /api
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching professors:", error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}

export async function getClassrooms() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/classrooms`); // Добавили /api
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching classrooms:", error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}

export async function getSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule`); // Здесь /api не нужен
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching schedule:", error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}

export async function getSubjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/subjects`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return [];
    }
}

export async function createLesson(lessonData) {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(lessonData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating lesson:", error);
        throw error; // Перебрасываем ошибку, чтобы вызывающая функция могла ее обработать
    }
}

export async function updateLessonDay(lessonId, newDay) {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule/${lessonId}`, {
            method: 'PATCH', // Используем PATCH для частичного обновления
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ day: newDay }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true; 
    } catch (error) {
        console.error(`Error updating lesson ${lessonId} day to ${newDay}:`, error);
        throw error;
    }
}

export async function deleteLesson(lessonId) {
    try {
        const response = await fetch(`${API_BASE_URL}/schedule/${lessonId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error(`Error deleting lesson ${lessonId}:`, error);
        throw error;
    }
}

export async function deleteBreak(breakId) {
    try {
        const response = await fetch(`${API_BASE_URL}/break/${breakId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error(`Error deleting break ${breakId}:`, error);
        throw error;
    }
}
