import { openTab } from './tabManager.js';
import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule } from './api.js'; // Импортируем getSchedule

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;

document.addEventListener('DOMContentLoaded', async () => { // Делаем функцию асинхронной
    // Заполняем выпадающие списки асинхронно
    const professors = await getProfessors();
    populateSelect('teacherSelect', professors, 'name'); // Явно указываем 'name' для преподавателей

    const classrooms = await getClassrooms();
    populateSelect('classroomSelect', classrooms, 'number'); // Указываем 'number' для кабинетов

    // Настраиваем контекстное меню
    setupContextMenu();

    // Загружаем и отображаем расписание
    const schedule = await getSchedule();
    const dayContainers = document.querySelectorAll('.table-container tbody .day');

    schedule.forEach(lessonData => {
        if (lessonData.day >= 1 && lessonData.day <= dayContainers.length) {
            const dayDiv = dayContainers[lessonData.day - 1]; // Получаем div дня
            
            const id = "ID" + lessonData.id; // Используем id из данных для уникальности
            const d = document.createElement('div');
            d.className = 'lesson';
            d.id = id;
            d.draggable = true;
            d.ondragstart = window.drag; // Используем глобальную функцию drag

            // Формируем строку информации: "Преподаватель, Аудитория"
            const infoString = `${lessonData.professor.name}, ${lessonData.classroom.number}`;

            d.innerHTML = `
                <div class="lesson-title">${lessonData.title}</div>
                <div>${infoString}</div>
                <div class="lesson-time">${lessonData.time}</div>
            `;
            dayDiv.appendChild(d);
        }
    });
});
