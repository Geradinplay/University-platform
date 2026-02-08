import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule, getSubjects, getBreaks } from './api.js'; // ДОБАВЛЕНО getBreaks
import { parseTimeToMinutes } from './utils.js';
import { createBreak } from './api.js';

// ДОБАВЛЕНО: Функция для управления вкладками (перенесена из tabManager.js)
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
window.createBreakManual = async function() {
    const day = parseInt(document.getElementById('breakDaySelect').value);
    const start = document.getElementById('breakStartInput').value.trim();
    const end = document.getElementById('breakEndInput').value.trim();

    // Проверка формата времени
    const timeRegex = /^(\d{1,2}):([0-5]\d)$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
        alert('Введите время в формате ЧЧ:ММ');
        return;
    }

    // Форматируем время с ведущими нулями
    function formatTime(t) {
        const [h, m] = t.split(':').map(Number);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    const formattedStart = formatTime(start);
    const formattedEnd = formatTime(end);

    const duration = parseTimeToMinutes(formattedEnd) - parseTimeToMinutes(formattedStart);
    if (duration <= 0) {
        alert('Конец перерыва должен быть позже начала!');
        return;
    }

    try {
        const newBreak = await createBreak({
            day,
            startTime: formattedStart,
            endTime: formattedEnd,
            duration,
            positionAfterLessonId: null // Можно добавить выбор после какого урока, если нужно
        });
        alert('Перерыв успешно добавлен!');

        // --- Добавить break-block в расписание по времени ---
        const dayContainers = document.querySelectorAll('.table-container tbody td .day');
        if (day >= 1 && day <= dayContainers.length) {
            const dayContainer = dayContainers[day - 1];

            const b = document.createElement('div');
            b.className = 'break-block';
            b.id = "break-" + newBreak.id;
            b.innerText = `ПЕРЕРЫВ: ${duration} МИН.`;
            b.dataset.breakId = newBreak.id;
            b.dataset.day = newBreak.day;
            b.dataset.startTime = newBreak.startTime;
            b.dataset.endTime = newBreak.endTime;
            b.dataset.duration = duration;
            b.draggable = true;
            b.ondragstart = window.drag;
            b.ondragover = window.allowDrop;
            b.ondrop = window.drop;

            // --- Вставить break-block по времени среди всех элементов ---
            const breakStartMinutes = parseTimeToMinutes(newBreak.startTime);
            let insertReferenceNode = null;
            for (const child of Array.from(dayContainer.children)) {
                if (child.dataset && child.dataset.startTime) {
                    const childStartMinutes = parseTimeToMinutes(child.dataset.startTime);
                    if (breakStartMinutes < childStartMinutes) {
                        insertReferenceNode = child;
                        break;
                    }
                }
            }
            dayContainer.insertBefore(b, insertReferenceNode);
        }
    } catch (error) {
        alert('Ошибка при создании перерыва: ' + error.message);
    }
};

window.addClassroom = function() {
    const number = document.getElementById('newClassroomNumber').value.trim();
    if (!number) {
        alert('Введите номер аудитории!');
        return;
    }
    // Можно добавить API-запрос, сейчас просто добавим в select
    const classroomSelect = document.getElementById('classroomSelect');
    const option = document.createElement('option');
    option.value = number;
    option.textContent = number;
    classroomSelect.appendChild(option);
    document.getElementById('newClassroomNumber').value = '';
    alert('Аудитория добавлена!');
};

window.addProfessor = function() {
    const name = document.getElementById('newProfessorName').value.trim();
    if (!name) {
        alert('Введите имя преподавателя!');
        return;
    }
    // Можно добавить API-запрос, сейчас просто добавим в select
    const teacherSelect = document.getElementById('teacherSelect');
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    teacherSelect.appendChild(option);
    document.getElementById('newProfessorName').value = '';
    alert('Преподаватель добавлен!');
};

window.addSubject = function() {
    const name = document.getElementById('newSubjectName').value.trim();
    if (!name) {
        alert('Введите название предмета!');
        return;
    }
    // Можно добавить API-запрос, сейчас просто добавим в select
    const subjectSelect = document.getElementById('subjectSelect');
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    subjectSelect.appendChild(option);
    document.getElementById('newSubjectName').value = '';
    alert('Предмет добавлен!');
};

// --- Пагинация для списков ---
async function loadClassroomList(page = 0, pageSize = 50) {
    const classrooms = await getClassrooms();
    const container = document.getElementById('classroom-list');
    if (!container) return;
    if (page === 0) container.innerHTML = '';
    const slice = classrooms.slice(page * pageSize, (page + 1) * pageSize);
    slice.forEach(c => {
        const div = document.createElement('div');
        div.className = 'scroll-list-item';
        div.textContent = c.number;
        container.appendChild(div);
    });
    // Возвращаем true если есть еще элементы
    return classrooms.length > (page + 1) * pageSize;
}

async function loadProfessorList(page = 0, pageSize = 50) {
    const professors = await getProfessors();
    const container = document.getElementById('professor-list');
    if (!container) return;
    if (page === 0) container.innerHTML = '';
    const slice = professors.slice(page * pageSize, (page + 1) * pageSize);
    slice.forEach(p => {
        const div = document.createElement('div');
        div.className = 'scroll-list-item';
        div.textContent = p.name;
        container.appendChild(div);
    });
    return professors.length > (page + 1) * pageSize;
}

async function loadSubjectList(page = 0, pageSize = 50) {
    const subjects = await getSubjects();
    const container = document.getElementById('subject-list');
    if (!container) return;
    if (page === 0) container.innerHTML = '';
    const slice = subjects.slice(page * pageSize, (page + 1) * pageSize);
    slice.forEach(s => {
        const div = document.createElement('div');
        div.className = 'scroll-list-item';
        div.textContent = s.name;
        container.appendChild(div);
    });
    return subjects.length > (page + 1) * pageSize;
}

// --- Lazy loading при скролле ---
function setupScrollLoading(listId, loaderFn) {
    const container = document.getElementById(listId);
    if (!container) return;
    let page = 0;
    let loading = false;
    let hasMore = true;
    container.addEventListener('scroll', async function() {
        if (!hasMore || loading) return;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 20) {
            loading = true;
            hasMore = await loaderFn(++page);
            loading = false;
        }
    });
    // Первичная загрузка
    loaderFn(0);
}

// --- Инициализация списков при открытии вкладки ---
window.openTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-btn[onclick="window.openTab('${tabId}')"]`).classList.add('active');
    // При открытии вкладки — загружаем соответствующий список
    if (tabId === 'add-classroom-tab') setupScrollLoading('classroom-list', loadClassroomList);
    if (tabId === 'add-professor-tab') setupScrollLoading('professor-list', loadProfessorList);
    if (tabId === 'add-subject-tab') setupScrollLoading('subject-list', loadSubjectList);
};

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
        const breaks = await getBreaks(); // ДОБАВЛЕНО: Получаем перерывы из базы
        const bufferContent = document.getElementById('buffer-content');
        const dayContainers = document.querySelectorAll('.table-container tbody td .day'); 

        // --- Добавление занятий ---
        schedule.forEach(lessonData => {
            // Проверка на корректность данных урока
            if (!lessonData || !lessonData.id || !lessonData.subject || !lessonData.professor || !lessonData.classroom || !lessonData.startTime || !lessonData.endTime) {
                console.warn('Skipping malformed lesson data:', lessonData);
                return;
            }

            let targetContainer;
            if (lessonData.day === 0) {
                targetContainer = bufferContent; // Целевой контейнер для буфера
            } else if (lessonData.day >= 1 && lessonData.day <= dayContainers.length) {
                targetContainer = dayContainers[lessonData.day - 1]; // Получаем div .day внутри td
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
            d.dataset.startTime = lessonData.startTime;
            d.dataset.endTime = lessonData.endTime;


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

            // УДАЛЕНО: Не добавляем break-block при загрузке уроков
            // if (lessonData.day !== 0 && document.getElementById('breakToggle')?.checked) {
            //     if (!(d.nextSibling && d.nextSibling.classList.contains('break-block'))) {
            //         const min = document.getElementById('breakDuration')?.value || 10;
            //         const b = document.createElement('div');
            //         b.className = 'break-block';
            //         b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
            //         targetContainer.insertBefore(b, d.nextSibling);
            //     }
            // }
        });

        // --- Добавление перерывов из базы ---
        breaks.forEach(breakData => {
            if (!breakData || !breakData.id || !breakData.day || !breakData.startTime || !breakData.endTime) return;
            if (breakData.day === 0) {
                // Добавляем break-block в буфер
                const b = document.createElement('div');
                b.className = 'break-block';
                b.id = "break-" + breakData.id;
                b.innerText = `ПЕРЕРЫВ: ${parseTimeToMinutes(breakData.endTime) - parseTimeToMinutes(breakData.startTime)} МИН.`;
                b.dataset.breakId = breakData.id;
                b.dataset.day = breakData.day;
                b.dataset.startTime = breakData.startTime;
                b.dataset.endTime = breakData.endTime;
                b.dataset.duration = parseTimeToMinutes(breakData.endTime) - parseTimeToMinutes(breakData.startTime);
                b.draggable = true;
                b.ondragstart = window.drag;
                b.ondragover = window.allowDrop;
                b.ondrop = window.drop;
                bufferContent.appendChild(b);
            } else if (breakData.day >= 1 && breakData.day <= dayContainers.length) {
                // ...existing code for adding break-block to day...
                let lessonDiv = null;
                for (const child of dayContainers[breakData.day - 1].children) {
                    if (
                        child.classList.contains('lesson') &&
                        child.dataset.endTime === breakData.startTime
                    ) {
                        lessonDiv = child;
                        break;
                    }
                }
                if (lessonDiv) {
                    const b = document.createElement('div');
                    b.className = 'break-block';
                    b.id = "break-" + breakData.id;
                    b.innerText = `ПЕРЕРЫВ: ${parseTimeToMinutes(breakData.endTime) - parseTimeToMinutes(breakData.startTime)} МИН.`;
                    b.dataset.breakId = breakData.id;
                    b.dataset.day = breakData.day;
                    b.dataset.startTime = breakData.startTime;
                    b.dataset.endTime = breakData.endTime;
                    b.dataset.duration = parseTimeToMinutes(breakData.endTime) - parseTimeToMinutes(breakData.startTime);
                    b.draggable = true;
                    b.ondragstart = window.drag;
                    b.ondragover = window.allowDrop;
                    b.ondrop = window.drop;
                    dayContainers[breakData.day - 1].insertBefore(b, lessonDiv.nextSibling);
                }
            }
        });

    } catch (error) {
        console.error("Ошибка при загрузке приложения:", error);
    }
});