import { openTab } from './tabManager.js';
import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule, getSubjects } from './mockApi.js'; // ИЗМЕНЕНО: теперь используем mockApi.js
import { parseTimeToMinutes } from './utils.js';

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const subjects = await getSubjects();
        populateSelect('subjectSelect', subjects, 'name');

        const professors = await getProfessors();
        populateSelect('teacherSelect', professors, 'name');

        const classrooms = await getClassrooms();
        populateSelect('classroomSelect', classrooms, 'number');

        setupContextMenu();

        const schedule = await getSchedule();
        // Изменено: теперь dayContainers ссылаются на .day внутри td, и их индексация начинается с 1
        const dayContainers = document.querySelectorAll('.table-container tbody td .day'); 

        schedule.forEach(lessonData => {
            // Убедимся, что lessonData.day используется корректно: 0 для буфера, 1-5 для дней
            if (lessonData.day >= 0 && lessonData.day <= dayContainers.length) {
                let targetContainer;
                if (lessonData.day === 0) {
                    targetContainer = document.getElementById('buffer-container'); // ИЗМЕНЕНО: ID буфера
                } else {
                    targetContainer = dayContainers[lessonData.day - 1]; // Получаем div .day внутри td
                }
                
                if (!targetContainer) return;

                const d = document.createElement('div');
                d.className = 'lesson';
                d.id = "lesson-" + lessonData.id;
                d.draggable = true;
                d.ondragstart = window.drag;
                d.ondragover = window.allowDrop; // Добавлено, чтобы ondrop срабатывал
                d.ondrop = window.drop; // Добавлено
                d.dataset.day = lessonData.day;
                d.dataset.subjectId = lessonData.subject?.id; // Используем optional chaining
                d.dataset.professorId = lessonData.professor?.id;
                d.dataset.classroomId = lessonData.classroom?.id;

                const infoString = `${lessonData.professor?.name || 'N/A'}, ${lessonData.classroom?.number || 'N/A'}`;
                const timeDisplay = lessonData.startTime && lessonData.endTime 
                    ? `${lessonData.startTime}-${lessonData.endTime}`
                    : lessonData.time || 'N/A';

                d.innerHTML = `
                    <div class="lesson-title">${lessonData.subject?.name || 'N/A'}</div>
                    <div>${infoString}</div>
                    <div class="lesson-time">${timeDisplay}</div>
                `;
                
                // Логика сортировки и вставки занятий (без автоматических перерывов пока что)
                const newLessonStartTime = parseTimeToMinutes(timeDisplay.split('-')[0]);
                let insertReferenceNode = null;
                for (const child of Array.from(targetContainer.children)) {
                    if (child.classList.contains('lesson')) {
                        const existingLessonTime = parseTimeToMinutes(child.querySelector('.lesson-time').innerText.split('-')[0]);
                        if (newLessonStartTime < existingLessonTime) {
                            insertReferenceNode = child;
                            break;
                        }
                    }
                }
                targetContainer.insertBefore(d, insertReferenceNode);
            }
        });
    } catch (error) {
        console.error("Ошибка при загрузке приложения:", error);
    }
});