import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule, getSubjects } from './api.js'; 
import { parseTimeToMinutes } from './utils.js';

// ДОБАВЛЕНО: Функция для управления вкладками
export function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-btn[onclick="window.openTab('${tabId}')"]`).classList.add('active');
}

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab; // ДОБАВЛЕНО: Делаем openTab глобальной
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

        // Устанавливаем активную вкладку при загрузке страницы (например, "Создать занятие")
        openTab('lesson-tab-content'); // ДОБАВЛЕНО

        const schedule = await getSchedule();
        const bufferContent = document.getElementById('buffer-content'); // ИЗМЕНЕНО: Целевой контейнер для буфера
        const dayContainers = document.querySelectorAll('.table-container tbody td .day'); 

        schedule.forEach(lessonData => {
            if (!lessonData || !lessonData.id || !lessonData.subject || !lessonData.professor || !lessonData.classroom || !lessonData.startTime || !lessonData.endTime) {
                console.warn('Skipping malformed lesson data:', lessonData);
                return;
            }

            let targetContainer;
            if (lessonData.day === 0) {
                targetContainer = bufferContent; // ИЗМЕНЕНО: Целевой контейнер для буфера
            } else if (lessonData.day >= 1 && lessonData.day <= dayContainers.length) {
                targetContainer = dayContainers[lessonData.day - 1];
            } else {
                console.warn(`Skipping lesson ${lessonData.id} due to invalid day value: ${lessonData.day}`);
                return;
            }
            
            if (!targetContainer) {
                console.warn(`Target container not found for lesson ${lessonData.id}, day ${lessonData.day}`);
                return;
            }

            const d = document.createElement('div');
            d.className = 'lesson';
            d.id = "lesson-" + lessonData.id;
            d.draggable = true;
            d.ondragstart = window.drag;
            d.ondragover = window.allowDrop; 
            d.ondrop = window.drop; 
            d.dataset.day = lessonData.day;
            d.dataset.subjectId = lessonData.subject.id;
            d.dataset.professorId = lessonData.professor.id;
            d.dataset.classroomId = lessonData.classroom.id;

            const infoString = `${lessonData.professor.name}, ${lessonData.classroom.number}`;
            const timeDisplay = `${lessonData.startTime}-${lessonData.endTime}`;

            d.innerHTML = `
                <div class="lesson-title">${lessonData.subject.name}</div>
                <div>${infoString}</div>
                <div class="lesson-time">${timeDisplay}</div>
            `;
            
            // Логика сортировки при добавлении в день или буфер
            const newLessonStartTime = parseTimeToMinutes(timeDisplay.split('-')[0]);
            let insertReferenceNode = null;
            
            for (const child of Array.from(targetContainer.children)) {
                if (child.classList.contains('lesson')) {
                    const existingLessonTimeText = child.querySelector('.lesson-time')?.innerText;
                    if (existingLessonTimeText) {
                        const existingLessonTime = parseTimeToMinutes(existingLessonTimeText.split('-')[0]);
                        if (newLessonStartTime < existingLessonTime) {
                            insertReferenceNode = child;
                            break;
                        }
                    }
                }
            }
            targetContainer.insertBefore(d, insertReferenceNode);

            // Если занятие в дне, добавляем перерыв, если включена опция
            if (lessonData.day !== 0 && document.getElementById('breakToggle')?.checked) {
                if (!(d.nextSibling && d.nextSibling.classList.contains('break-block'))) {
                    const min = document.getElementById('breakDuration')?.value || 10;
                    const b = document.createElement('div');
                    b.className = 'break-block';
                    b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                    targetContainer.insertBefore(b, d.nextSibling);
                }
            }
        });
    } catch (error) {
        console.error("Ошибка при загрузке приложения:", error);
    }
});