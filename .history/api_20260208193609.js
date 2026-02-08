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
        const response = await fetch(`${API_BASE_URL}/api/schedule`, { 
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

export async function updateLessonDay(lessonId, dataToUpdate) { // ИЗМЕНЕНО: dataToUpdate
    try {
        const response = await fetch(`${API_BASE_URL}/api/schedule/${lessonId}`, { 
            method: 'PUT', // Метод PUT
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToUpdate), // Отправляем полный объект
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
        const response = await fetch(`${API_BASE_URL}/api/schedule/${lessonId}`, { 
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

export async function getBreaks() { 
    try {
        const response = await fetch(`${API_BASE_URL}/api/break`); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching breaks:", error);
        return [];
    }
}

export async function createBreak(breakData) { 
    try {
        const response = await fetch(`${API_BASE_URL}/api/break`, { 
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

export async function updateBreak(breakId, dataToUpdate) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/break/${breakId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToUpdate),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error updating break ${breakId}:`, error);
        throw error;
    }
}

export async function deleteBreak(breakId) { 
    try {
        const response = await fetch(`${API_BASE_URL}/api/break/${breakId}`, { 
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
