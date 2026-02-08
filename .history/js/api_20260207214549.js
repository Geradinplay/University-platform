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
