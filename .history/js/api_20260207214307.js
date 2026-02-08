const API_BASE_URL = 'http://localhost:8080';

export async function getProfessors() {
    try {
        const response = await fetch(`${API_BASE_URL}/professors`);
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
        const response = await fetch(`${API_BASE_URL}/classrooms`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching classrooms:", error);
        return []; // Возвращаем пустой массив в случае ошибки
    }
}
