import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule, getSubjects, getBreaks } from './api.js'; // ИЗМЕНЕНО: Добавлен getBreaks
import { parseTimeToMinutes } from './utils.js';
import { showModal } from './modal.js'; // ДОБАВЛЕНО: Импорт showModal

// ДОБАВЛЕНО: Функция для управления вкладками
export function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-btn[onclick="window.openTab('${tabId}')"]`).classList.add('active');
}

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab; 
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;
window.showModal = showModal; // ДОБАВЛЕНО: Делаем showModal глобально доступным

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const subjects = await getSubjects();
        populateSelect('subjectSelect', subjects, 'name');

        const professors = await getProfessors();
        populateSelect('teacherSelect', professors, 'name');

        const classrooms = await getClassrooms();
        populateSelect('classroomSelect', classrooms, 'number');

        setupContextMenu();

        // Устанавливаем активную вкладку при загрузке страницы (например, "Создать занятие")
        openTab('lesson-tab-content');

        const schedule = await getSchedule();
        // ДОБАВЛЕНО: Загрузка перерывов с сервера
        const breaks = await getBreaks();

        const bufferContent = document.getElementById('buffer-content');
        const dayContainers = document.querySelectorAll('.table-container tbody td .day');

        // Сортируем все элементы (занятия и перерывы) по времени и дню для корректного отображения
        const allScheduleItems = [...schedule.map(item => ({...item, type: 'lesson'})), ...breaks.map(item => ({...item, type: 'break'}))];
        allScheduleItems.sort((a, b) => {
            if (a.day !== b.day) {
                return a.day - b.day;
            }
            const timeA = parseTimeToMinutes(a.startTime);
            const timeB = parseTimeToMinutes(b.startTime);
            return timeA - timeB;
        });

        allScheduleItems.forEach(itemData => {
            // Проверка на корректность данных
            if (!itemData || !itemData.id || !itemData.startTime || !itemData.endTime || itemData.day === undefined) {
                console.warn('Skipping malformed item data:', itemData);
                return;
            }

            let targetContainer;
            if (itemData.day === 0) {
                targetContainer = bufferContent;
            } else if (itemData.day >= 1 && itemData.day <= dayContainers.length) {
                targetContainer = dayContainers[itemData.day - 1];
            } else {
                console.warn(`Skipping item ${itemData.id} due to invalid day value: ${itemData.day}`);
                return;
            }
            
            if (!targetContainer) {
                console.warn(`Target container not found for item ${itemData.id}, day ${itemData.day}`);
                return;
            }

            let element;
            if (itemData.type === 'lesson') {
                const lessonData = itemData;
                // Проверка на наличие необходимых свойств для занятия
                if (!lessonData.subject || !lessonData.professor || !lessonData.classroom) {
                    console.warn('Skipping malformed lesson data (missing subject/professor/classroom):', lessonData);
                    return;
                }

                const d = document.createElement('div');
                d.className = 'lesson';
                d.id = "lesson-" + lessonData.id;
                d.draggable = true;
                d.ondragstart = window.drag;
                // NOTE: ondragover and ondrop on elements are generally discouraged for complex drag-and-drop
                // prefer setting them on dropzones and using event delegation or checking target within drop handler.
                // However, for existing implementation, we keep them.
                d.ondragover = window.allowDrop; 
                d.ondrop = window.drop; 
                d.dataset.day = lessonData.day;
                d.dataset.subjectId = lessonData.subject.id;
                d.dataset.professorId = lessonData.professor.id;
                d.dataset.classroomId = lessonData.classroom.id;
                d.dataset.startTime = lessonData.startTime;
                d.dataset.endTime = lessonData.endTime;

                const infoString = `${lessonData.professor.name}, ${lessonData.classroom.number}`;
                const timeDisplay = `${lessonData.startTime}-${lessonData.endTime}`;

                d.innerHTML = `
                    <div class="lesson-title">${lessonData.subject.name}</div>
                    <div>${infoString}</div>
                    <div class="lesson-time">${timeDisplay}</div>
                `;
                element = d;

            } else if (itemData.type === 'break') {
                const breakData = itemData;
                const b = document.createElement('div');
                b.className = 'break-block';
                b.id = "break-" + breakData.id; // ДОБАВЛЕНО: ID для перерыва
                b.innerText = `ПЕРЕРЫВ: ${breakData.duration} МИН.`;
                b.dataset.breakId = breakData.id; // ДОБАВЛЕНО: dataset для ID перерыва
                b.dataset.day = breakData.day;
                b.dataset.startTime = breakData.startTime; // ДОБАВЛЕНО: startTime
                b.dataset.endTime = breakData.endTime;     // ДОБАВЛЕНО: endTime
                b.dataset.duration = breakData.duration;   // ДОБАВЛЕНО: duration
                element = b;
            } else {
                console.warn('Unknown item type:', itemData);
                return;
            }
            
            // Логика сортировки при добавлении в день или буфер
            const newItemStartTime = parseTimeToMinutes(itemData.startTime);
            let insertReferenceNode = null;
            
            for (const child of Array.from(targetContainer.children)) {
                const childStartTimeText = child.dataset.startTime;
                if (childStartTimeText) {
                    const existingItemTime = parseTimeToMinutes(childStartTimeText);
                    if (newItemStartTime < existingItemTime) {
                        insertReferenceNode = child;
                        break;
                    }
                }
            }
            targetContainer.insertBefore(element, insertReferenceNode);
        });
    } catch (error) {
        console.error("Ошибка при загрузке приложения:", error);
    }
});
