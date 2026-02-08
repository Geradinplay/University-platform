// Этот файл остается без изменений, как реальный API клиент.
// В настоящее время используется mockApi.js
const API_BASE_URL = 'http://localhost:8080';

export async function getProfessors() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/professors`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching professors:", error);
        return [];
    }
}

export async function getClassrooms() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/classrooms`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching classrooms:", error);
        return [];
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

export async function getSchedule() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule`); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching schedule:", error);
        return [];
    }
}

export async function createLesson(lessonData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule`, { // ИЗМЕНЕНО: URL
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
        throw error;
    }
}

export async function updateLessonDay(lessonId, dataToUpdate) { // ИЗМЕНЕНО: dataToUpdate вместо newDay
    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/${lessonId}`, { // ИЗМЕНЕНО: URL
            method: 'PUT', // ИЗМЕНЕНО: Метод на PUT
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToUpdate), // ИЗМЕНЕНО: Отправляем весь объект для PUT
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); // Возвращаем обновленный объект урока
    } catch (error) {
        console.error(`Error updating lesson ${lessonId}:`, error);
        throw error;
    }
}

export async function deleteLesson(lessonId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/${lessonId}`, { // ИЗМЕНЕНО: URL
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

export async function getBreaks() { // ДОБАВЛЕНО
    try {
        const response = await fetch(`${API_BASE_URL}/api/break`); // ИЗМЕНЕНО: URL
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching breaks:", error);
        return [];
    }
}

export async function createBreak(breakData) { // ДОБАВЛЕНО
    try {
        const response = await fetch(`${API_BASE_URL}/api/break`, { // ИЗМЕНЕНО: URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(breakData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating break:", error);
        throw error;
    }
}

export async function deleteBreak(breakId) { // ДОБАВЛЕНО
    try {
        const response = await fetch(`${API_BASE_URL}/api/break/${breakId}`, { // ИЗМЕНЕНО: URL
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
