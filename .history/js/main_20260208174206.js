import { openTab } from './tabManager.js';
import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule, getSubjects, createLesson, updateLessonDay } from './api.js'; // Добавляем createLesson, updateLessonDay

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;

document.addEventListener('DOMContentLoaded', async () => { // Делаем функцию асинхронной
    // Заполняем выпадающие списки асинхронно
    const subjects = await getSubjects();
    populateSelect('subjectSelect', subjects, 'name'); // Заполняем предметы

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
        if (lessonData.day >= 0 && lessonData.day <= dayContainers.length) { // Учитываем day: 0 для буфера
            let targetContainer;
            if (lessonData.day === 0) {
                targetContainer = document.getElementById('buffer');
            } else {
                targetContainer = dayContainers[lessonData.day - 1]; // Получаем div дня
            }
            
            if (!targetContainer) return; // Проверка на случай, если контейнер не найден

            const d = document.createElement('div');
            d.className = 'lesson';
            d.id = "lesson-" + lessonData.id; // Более уникальный ID для DOM-элементов
            d.draggable = true;
            d.ondragstart = window.drag; // Используем глобальную функцию drag
            d.dataset.day = lessonData.day; // Сохраняем день в data-атрибуте

            // Сохраняем ID сущностей для использования в формах или при дальнейших запросах
            d.dataset.subjectId = lessonData.subject.id;
            d.dataset.professorId = lessonData.professor.id;
            d.dataset.classroomId = lessonData.classroom.id;

            // Формируем строку информации: "Преподаватель, Аудитория"
            const infoString = `${lessonData.professor.name}, ${lessonData.classroom.number}`;

            d.innerHTML = `
                <div class="lesson-title">${lessonData.subject.name}</div>
                <div>${infoString}</div>
                <div class="lesson-time">${lessonData.time}</div>
            `;
            
            // Если занятие в дне, нужно вставить его отсортированным
            if (lessonData.day !== 0) {
                const newLessonStartTime = parseTimeToMinutes(lessonData.time.split('-')[0]);
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
            } else {
                targetContainer.appendChild(d); // В буфер просто добавляем
            }

            // Если занятие в дне и есть авто-перерыв
            if (lessonData.day !== 0 && document.getElementById('breakToggle').checked) {
                // Проверяем, существует ли уже блок перерыва сразу после этого занятия.
                if (!(d.nextSibling && d.nextSibling.classList.contains('break-block'))) {
                    const min = document.getElementById('breakDuration').value;
                    const b = document.createElement('div');
                    b.className = 'break-block';
                    b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                    targetContainer.insertBefore(b, d.nextSibling);
                }
            }
        }
    });
});

const BASE_URL = "http://localhost:8080";

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

async function loadSchedule() {
  try {
    const response = await fetch(`${BASE_URL}/schedule`);
    const lessons = await response.json();
    
    const scheduleContainer = document.getElementById("schedule");
    scheduleContainer.innerHTML = "";
    
    lessons.forEach((lesson) => {
      const startTime = lesson.startTime || "N/A";
      const endTime = lesson.endTime || "N/A";
      
      const lessonEl = document.createElement("div");
      lessonEl.className = "lesson";
      lessonEl.innerHTML = `
        <p><strong>${lesson.subject.name}</strong></p>
        <p>Время: ${startTime} - ${endTime}</p>
        <p>Преподаватель: ${lesson.professor.name}</p>
        <p>Аудитория: ${lesson.classroom.number}</p>
        <button onclick="deleteLesson(${lesson.id})">Удалить</button>
      `;
      scheduleContainer.appendChild(lessonEl);
    });
  } catch (error) {
    console.error("Error loading schedule:", error);
  }
}

async function loadBreaks() {
  try {
    const response = await fetch(`${BASE_URL}/break`);
    const breaks = await response.json();
    
    const breaksContainer = document.getElementById("breaks");
    breaksContainer.innerHTML = "";
    
    breaks.forEach((breakItem) => {
      const breakEl = document.createElement("div");
      breakEl.className = "break";
      breakEl.innerHTML = `
        <p>Перерыв: ${breakItem.startTime} - ${breakItem.endTime}</p>
        <p>День: ${breakItem.day}</p>
        <button onclick="deleteBreak(${breakItem.id})">Удалить</button>
      `;
      breaksContainer.appendChild(breakEl);
    });
  } catch (error) {
    console.error("Error loading breaks:", error);
  }
}

//# sourceMappingURL=main.js.map
