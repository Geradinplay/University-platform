import { populateSelect } from './utils/selectPopulator.js';
import { allowDrop, drag, drop } from './handlers/dragDropHandler.js';
import { addNewLesson } from './handlers/lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './handlers/contextMenuHandler.js';
import {
    getProfessors,
    getClassrooms,
    getLessonsByScheduleId,
    getSubjects,
    getBreaks,
    createBreak,
    login,
    register,
    apiRequest,
    // Добавить новые API:
    createSubject, updateSubject, deleteSubject,
    createProfessor, updateProfessor, deleteProfessor,
    createClassroom, updateClassroom, deleteClassroom,
    // Функции для работы с факультетами:
    getFaculties, getFacultyById, createFaculty, updateFaculty, deleteFaculty,
    // Функции для работы с расписаниями:
    getSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule
} from '../../api/api.js';
import { parseTimeToMinutes } from './utils/utils.js';

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

    // --- Проверка на пересечение с занятиями и другими перерывами ---
    const allowCollision = document.getElementById('settings-content')?.querySelector('#allowCollision')?.checked || false;
    if (!allowCollision) {
        // Найти контейнер для выбранного дня
        const dayContainers = document.querySelectorAll('.table-container tbody td .day');
        if (day >= 1 && day <= dayContainers.length) {
            const dayContainer = dayContainers[day - 1];
            const newBreakStart = parseTimeToMinutes(formattedStart);
            const newBreakEnd = parseTimeToMinutes(formattedEnd);

            for (const child of Array.from(dayContainer.children)) {
                const childStart = child.dataset?.startTime;
                const childEnd = child.dataset?.endTime;
                if (childStart && childEnd) {
                    const childStartMin = parseTimeToMinutes(childStart);
                    const childEndMin = parseTimeToMinutes(childEnd);
                    // Проверка на пересечение интервалов
                    if (newBreakStart < childEndMin && newBreakEnd > childStartMin) {
                        alert('Ошибка! Перерыв пересекается с другим занятием или перерывом.');
                        return;
                    }
                }
            }
        }
    }

    try {
        const newBreak = await createBreak({
            day,
            startTime: formattedStart,
            endTime: formattedEnd,
            duration,
            positionAfterLessonId: null, // Можно добавить выбор после какого урока, если нужно
            scheduleId: Number(localStorage.getItem('currentScheduleId') || 1)
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

window.addClassroom = async function() {
    const number = document.getElementById('newClassroomNumber').value.trim();
    if (!number) {
        alert('Введите номер аудитории!');
        return;
    }
    try {
        const newClassroom = await createClassroom({ number });
        document.getElementById('newClassroomNumber').value = '';
        alert('Аудитория добавлена!');
        // Обновить список
        loadClassroomList(0);
        // Обновить select
        const classrooms = await getClassrooms();
        populateSelect('classroomSelect', classrooms, 'number');
    } catch (err) {
        alert('Ошибка при добавлении аудитории');
    }
};

window.addProfessor = async function() {
    const name = document.getElementById('newProfessorName').value.trim();
    if (!name) {
        alert('Введите имя преподавателя!');
        return;
    }
    try {
        await createProfessor({ name });
        document.getElementById('newProfessorName').value = '';
        alert('Преподаватель добавлен!');
        loadProfessorList(0);
        // Обновить select (используем name как value)
        const professors = await getProfessors();
        populateSelect('teacherSelect', professors, 'name');
    } catch (err) {
        alert('Ошибка при добавлении преподавателя');
    }
};

window.addSubject = async function() {
    const name = document.getElementById('newSubjectName').value.trim();
    if (!name) {
        alert('Введите название предмета!');
        return;
    }
    try {
        await createSubject({ name });
        document.getElementById('newSubjectName').value = '';
        alert('Предмет добавлен!');
        loadSubjectList(0);
        // Обновить select (используем name как value)
        const subjects = await getSubjects();
        populateSelect('subjectSelect', subjects, 'name');
    } catch (err) {
        alert('Ошибка при добавлении предмета');
    }
};

window.addFaculty = async function() {
    const name = document.getElementById('createFacultyName').value.trim();
    const shortName = document.getElementById('createFacultyShortName').value.trim();
    if (!name) {
        alert('Введите название факультета!');
        return;
    }
    if (!shortName) {
        alert('Введите краткое название факультета!');
        return;
    }
    try {
        await createFaculty({ name, shortName });
        document.getElementById('createFacultyName').value = '';
        document.getElementById('createFacultyShortName').value = '';
        alert('Факультет добавлен!');
        await loadFaculties(); // Перезагрузить список факультетов
        closeCreateFacultyModal(); // Закрыть модальное окно после создания
    } catch (err) {
        alert('Ошибка при добавлении факультета');
        console.error(err);
    }
};

window.addSchedule = async function() {
    const name = document.getElementById('createScheduleName').value.trim();
    const facultyId = parseInt(document.getElementById('createScheduleFacultyId').value);
    if (!name) {
        alert('Введите название расписания!');
        return;
    }
    if (isNaN(facultyId)) {
        alert('Выберите факультет!');
        return;
    }
    try {
        await createSchedule({ name, facultyId });
        document.getElementById('createScheduleName').value = '';
        document.getElementById('createScheduleFacultyId').value = '';
        alert('Расписание добавлено!');
        await loadSchedules(); // Перезагрузить список факультетов и расписаний
        closeCreateScheduleModal(); // Закрыть модальное окно после создания
    } catch (err) {
        alert('Ошибка при добавлении расписания');
    }
};

// Функции для управления модальным окном создания расписания
window.openCreateScheduleModal = function() {
    // Заполняем список факультетов в модальном окне расписания
    const scheduleSelect = document.getElementById('createScheduleFacultyId');
    const facultySelect = document.getElementById('facultySelect');
    scheduleSelect.innerHTML = '<option value="">-- Выберите факультет --</option>';

    Array.from(facultySelect.options).forEach(option => {
        if (option.value) {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.textContent = option.textContent;
            scheduleSelect.appendChild(newOption);
        }
    });

    document.getElementById('create-schedule-modal').classList.add('active');
};

function closeCreateScheduleModal() {
    document.getElementById('create-schedule-modal').classList.remove('active');
    document.getElementById('createScheduleName').value = '';
    document.getElementById('createScheduleFacultyId').value = '';
}

// Функции для управления модальным окном обновления расписания
window.openEditScheduleModal = function() {
    const scheduleId = document.getElementById('scheduleSelect').value;
    const scheduleSelect = document.getElementById('scheduleSelect');

    if (!scheduleId) {
        alert('Пожалуйста, выберите расписание для обновления.');
        return;
    }

    // Получаем текущее имя расписания из select
    const scheduleName = scheduleSelect.options[scheduleSelect.selectedIndex].text;

    // Заполняем форму
    document.getElementById('editScheduleName').value = scheduleName;

    // Заполняем список факультетов
    const facultySelect = document.getElementById('facultySelect');
    const editFacultySelect = document.getElementById('editScheduleFacultyId');
    editFacultySelect.innerHTML = '<option value="">-- Выберите факультет --</option>';

    Array.from(facultySelect.options).forEach(option => {
        if (option.value) {
            const newOption = document.createElement('option');
            newOption.value = option.value;
            newOption.textContent = option.textContent;
            editFacultySelect.appendChild(newOption);
        }
    });

    document.getElementById('edit-schedule-modal').classList.add('active');
};

function closeEditScheduleModal() {
    document.getElementById('edit-schedule-modal').classList.remove('active');
    document.getElementById('editScheduleName').value = '';
    document.getElementById('editScheduleFacultyId').value = '';
}

// Функции для управления модальным окном удаления расписания
window.openDeleteScheduleModal = function() {
    const scheduleId = document.getElementById('scheduleSelect').value;
    const scheduleSelect = document.getElementById('scheduleSelect');

    if (!scheduleId) {
        alert('Пожалуйста, выберите расписание для удаления.');
        return;
    }

    const scheduleName = scheduleSelect.options[scheduleSelect.selectedIndex].text;
    document.getElementById('delete-schedule-name').textContent = `"${scheduleName}"`;

    document.getElementById('delete-schedule-modal').classList.add('active');
};

function closeDeleteScheduleModal() {
    document.getElementById('delete-schedule-modal').classList.remove('active');
}

// Функции для управления модальным окном создания факультета
window.openCreateFacultyModal = function() {
    document.getElementById('create-faculty-modal').classList.add('active');
};

function closeCreateFacultyModal() {
    document.getElementById('create-faculty-modal').classList.remove('active');
    document.getElementById('createFacultyName').value = '';
    document.getElementById('createFacultyShortName').value = '';
}

// Функции для управления модальным окном обновления факультета
window.openEditFacultyModal = function() {
    const facultyId = document.getElementById('facultySelect').value;
    const facultySelect = document.getElementById('facultySelect');

    if (!facultyId) {
        alert('Пожалуйста, выберите факультет для обновления.');
        return;
    }

    // Получаем текущее имя факультета из select
    const facultyName = facultySelect.options[facultySelect.selectedIndex].text;

    document.getElementById('editFacultyName').value = facultyName;
    document.getElementById('edit-faculty-modal').classList.add('active');
};

function closeEditFacultyModal() {
    document.getElementById('edit-faculty-modal').classList.remove('active');
    document.getElementById('editFacultyName').value = '';
    document.getElementById('editFacultyShortName').value = '';
}

// Функции для управления модальным окном удаления факультета
window.openDeleteFacultyModal = function() {
    const facultyId = document.getElementById('facultySelect').value;
    const facultySelect = document.getElementById('facultySelect');

    if (!facultyId) {
        alert('Пожалуйста, выберите факультет для удаления.');
        return;
    }

    const facultyName = facultySelect.options[facultySelect.selectedIndex].text;
    document.getElementById('delete-faculty-name').textContent = `"${facultyName}"`;

    document.getElementById('delete-faculty-modal').classList.add('active');
};

function closeDeleteFacultyModal() {
    document.getElementById('delete-faculty-modal').classList.remove('active');
}

// Функция для редактирования расписания
window.editSchedule = async function() {
    const scheduleId = document.getElementById('scheduleSelect').value;
    const name = document.getElementById('editScheduleName').value.trim();
    const facultyId = parseInt(document.getElementById('editScheduleFacultyId').value);

    if (!scheduleId) {
        alert('Выберите расписание!');
        return;
    }
    if (!name) {
        alert('Введите название расписания!');
        return;
    }
    if (isNaN(facultyId)) {
        alert('Выберите факультет!');
        return;
    }

    try {
        await updateSchedule(scheduleId, { name, facultyId });
        alert('Расписание обновлено!');
        await loadSchedules();
        closeEditScheduleModal();
    } catch (err) {
        alert('Ошибка при обновлении расписания');
    }
};

// Функция для удаления расписания
window.deleteSchedule = async function() {
    const scheduleId = document.getElementById('scheduleSelect').value;

    if (!scheduleId) {
        alert('Выберите расписание!');
        return;
    }

    try {
        await deleteSchedule(scheduleId);
        alert('Расписание удалено!');
        // Очищаем select расписания
        document.getElementById('scheduleSelect').value = '';
        document.getElementById('scheduleSelect').innerHTML = '<option value="">-- Выберите расписание --</option>';
        await loadSchedules();
        closeDeleteScheduleModal();
        // Очищаем доску
        document.getElementById('buffer-content').innerHTML = '<h2>Буфер</h2>';
        document.querySelectorAll('.table-container tbody td .day').forEach(dayContainer => {
            dayContainer.innerHTML = '';
        });
    } catch (err) {
        alert('Ошибка при удалении расписания');
    }
};

// Функция для редактирования факультета
window.editFaculty = async function() {
    const facultyId = document.getElementById('facultySelect').value;
    const name = document.getElementById('editFacultyName').value.trim();
    const shortName = document.getElementById('editFacultyShortName').value.trim();

    if (!facultyId) {
        alert('Выберите факультет!');
        return;
    }
    if (!name) {
        alert('Введите название факультета!');
        return;
    }
    if (!shortName) {
        alert('Введите краткое название факультета!');
        return;
    }

    try {
        await updateFaculty(facultyId, { name, shortName });
        alert('Факультет обновлен!');
        await loadFaculties();
        closeEditFacultyModal();
    } catch (err) {
        alert('Ошибка при обновлении факультета');
    }
};

// Функция для удаления факультета
window.deleteFaculty = async function() {
    const facultyId = document.getElementById('facultySelect').value;

    if (!facultyId) {
        alert('Выберите факультет!');
        return;
    }

    try {
        await deleteFaculty(facultyId);
        alert('Факультет удален!');
        await loadFaculties();
        closeDeleteFacultyModal();
        // Очищаем выбор расписания
        document.getElementById('scheduleSelect').innerHTML = '<option value="">-- Выберите расписание --</option>';
    } catch (err) {
        alert('Ошибка при удалении факультета');
    }
};

async function loadFaculties() {
    try {
        const faculties = await getFaculties();

        // Заполняем select факультетов
        const facultySelect = document.getElementById('facultySelect');
        if (facultySelect) {
            facultySelect.innerHTML = '<option value="">-- Выберите факультет --</option>';
            faculties.forEach(faculty => {
                const option = document.createElement('option');
                option.value = faculty.id;
                option.textContent = faculty.name;
                facultySelect.appendChild(option);
            });

            // Добавляем обработчик изменения факультета
            facultySelect.onchange = async () => {
                localStorage.setItem('currentFacultyId', facultySelect.value);
                await loadSchedulesByFaculty();
            };
        }
    } catch (error) {
        console.error('Ошибка при загрузке факультетов:', error);
    }
}

async function loadSchedulesByFaculty() {
    try {
        const facultyId = document.getElementById('facultySelect').value;
        const scheduleSelect = document.getElementById('scheduleSelect');

        if (!facultyId) {
            scheduleSelect.innerHTML = '<option value="">-- Выберите расписание --</option>';
            return;
        }

        const schedules = await getSchedules();
        const filteredSchedules = schedules.filter(s => s.facultyId == facultyId);

        scheduleSelect.innerHTML = '<option value="">-- Выберите расписание --</option>';
        filteredSchedules.forEach(schedule => {
            const option = document.createElement('option');
            option.value = schedule.id;
            option.textContent = schedule.name;
            scheduleSelect.appendChild(option);
        });

        // Добавляем обработчик для автоматической загрузки при выборе расписания
        scheduleSelect.onchange = () => {
            if (scheduleSelect.value) {
                window.loadSchedule();
            }
        };
    } catch (error) {
        console.error('Ошибка при загрузке расписаний:', error);
    }
}

async function loadSchedules() {
    await loadFaculties();
}

async function loadScheduleList(page = 0, pageSize = 50) {
    const schedules = await getSchedules();
    const container = document.getElementById('schedule-list');
    if (!container) return;
    if (page === 0) container.innerHTML = '';
    const slice = schedules.slice(page * pageSize, (page + 1) * pageSize);
    slice.forEach(s => {
        const div = document.createElement('div');
        div.className = 'scroll-list-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = s.name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = s.name;
            input.className = 'edit-input';
            input.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    try {
                        await updateSchedule(s.id, { name: input.value, facultyId: s.facultyId });
                        nameSpan.textContent = input.value;
                        div.replaceChild(nameSpan, input);
                        loadSchedules(); // Обновить список выбора расписаний
                    } catch (err) {
                        alert('Ошибка при обновлении расписания');
                    }
                }
                if (e.key === 'Escape') {
                    div.replaceChild(nameSpan, input);
                }
            };
            input.onblur = () => div.replaceChild(nameSpan, input);
            div.replaceChild(input, nameSpan);
            input.focus();
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = async () => {
            if (confirm('Удалить расписание?')) {
                try {
                    await deleteSchedule(s.id);
                    div.remove();
                    loadSchedules(); // Обновить список выбора расписаний
                } catch (err) {
                    alert('Ошибка при удалении расписания');
                }
            }
        };

        div.appendChild(nameSpan);
        div.appendChild(delBtn);
        container.appendChild(div);
    });
    return schedules.length > (page + 1) * pageSize;
}

window.loadSchedule = async function() {
    const scheduleId = document.getElementById('scheduleSelect').value;
    const facultyId = document.getElementById('facultySelect').value;

    if (!scheduleId) {
        alert('Пожалуйста, выберите расписание для загрузки.');
        return;
    }

    localStorage.setItem('currentScheduleId', scheduleId);
    localStorage.setItem('currentFacultyId', facultyId);

    // Очищаем текущее расписание на доске
    document.getElementById('buffer-content').innerHTML = '<h2>Буфер</h2>';
    document.querySelectorAll('.table-container tbody td .day').forEach(dayContainer => {
        dayContainer.innerHTML = '';
    });

    try {
        // Загружаем занятия для этого расписания
        let lessonsData = await getLessonsByScheduleId(scheduleId);
        let breaksData = await getBreaks(scheduleId);

        console.log(`📋 Загружаем расписание ID=${scheduleId}`);
        console.log(`📚 Получено занятий:`, lessonsData?.length || 0);
        console.log(`⏱️ Получено перерывов:`, breaksData?.length || 0);

        // Попытка fallback ТОЛЬКО если оба пусты И если есть scheduleId в данных для фильтрации
        if ((!lessonsData || lessonsData.length === 0) && (!breaksData || breaksData.length === 0)) {
            console.warn('⚠️ Новые эндпоинты вернули пустые данные для расписания ' + scheduleId);

            // Загружаем все данные для проверки наличия scheduleId
            try {
                const allLessons = await apiRequest('/api/schedule');
                const allBreaks = await apiRequest('/api/break');

                // Проверяем, есть ли scheduleId в данных
                const hasScheduleId = (Array.isArray(allLessons) && allLessons.length > 0 && allLessons[0].scheduleId !== undefined) ||
                                     (Array.isArray(allBreaks) && allBreaks.length > 0 && allBreaks[0].scheduleId !== undefined);

                if (hasScheduleId) {
                    console.log('✅ Данные содержат scheduleId, фильтруем по расписанию ' + scheduleId);
                    lessonsData = Array.isArray(allLessons)
                        ? allLessons.filter(lesson => lesson.scheduleId == scheduleId)
                        : [];
                    breaksData = Array.isArray(allBreaks)
                        ? allBreaks.filter(brk => brk.scheduleId == scheduleId)
                        : [];
                    console.log(`✅ Загружены через fallback с фильтрацией - занятий: ${lessonsData.length}, перерывов: ${breaksData.length}`);
                } else {
                    console.warn('❌ Данные НЕ содержат scheduleId, fallback невозможен. Показываем пусто для этого расписания.');
                    lessonsData = [];
                    breaksData = [];
                }
            } catch (fallbackError) {
                console.error('❌ Fallback ошибка:', fallbackError);
                lessonsData = [];
                breaksData = [];
            }
        }

        // Обработка разных типов возвращаемых данных
        if (!Array.isArray(lessonsData)) {
            lessonsData = [];
        }

        if (!Array.isArray(breaksData)) {
            breaksData = [];
        }

        console.log(`✨ Итого - занятий: ${lessonsData.length}, перерывов: ${breaksData.length}`);

        const bufferContent = document.getElementById('buffer-content');
        const dayContainers = document.querySelectorAll('.table-container tbody td .day');

        // --- Добавление занятий ---
        if (Array.isArray(lessonsData) && lessonsData.length > 0) {
            lessonsData.forEach((lessonData, index) => {
                if (!lessonData || !lessonData.id || !lessonData.subject || !lessonData.professor || !lessonData.classroom || !lessonData.startTime || !lessonData.endTime) {
                    console.warn(`⏭️ Пропуск некорректного занятия ID=${lessonData?.id}`);
                    return;
                }

                console.log(`✅ Добавляем: ${lessonData.subject?.name} (${lessonData.startTime}-${lessonData.endTime})`);

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
            });
        }

        // --- Добавление перерывов из базы ---
        if (Array.isArray(breaksData)) {
            breaksData.forEach(breakData => {
                if (!breakData || !breakData.id || breakData.day === null || breakData.day === undefined || !breakData.startTime || !breakData.endTime) {
                    console.warn('Skipping invalid break:', breakData);
                    return;
                }

                console.log(`📍 Загружаем break из БД: ID=${breakData.id}, day=${breakData.day}, time=${breakData.startTime}-${breakData.endTime}`);

                if (breakData.day === 0) {
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
                    console.log(`✅ Break ${breakData.id} добавлен в буфер`);
                } else if (breakData.day >= 1 && breakData.day <= dayContainers.length) {
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

                    const dayContainer = dayContainers[breakData.day - 1];
                    const breakStartMinutes = parseTimeToMinutes(breakData.startTime);
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
                    console.log(`✅ Break ${breakData.id} добавлен в день ${breakData.day}`);
                }
            });
        }

    } catch (error) {
        console.error("Ошибка при загрузке расписания:", error);
        alert('Ошибка при загрузке расписания: ' + error.message);
    }
};

// --- Пагинация для списков с кнопками удаления и редактированием ---
async function loadClassroomList(page = 0, pageSize = 50) {
    const classrooms = await getClassrooms();
    const container = document.getElementById('classroom-list');
    if (!container) return;
    if (page === 0) container.innerHTML = '';
    const slice = classrooms.slice(page * pageSize, (page + 1) * pageSize);
    slice.forEach(c => {
        const div = document.createElement('div');
        div.className = 'scroll-list-item';

        // --- Название с inline-редактированием ---
        const nameSpan = document.createElement('span');
        nameSpan.textContent = c.number;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => {
            // Показываем input для редактирования
            const input = document.createElement('input');
            input.type = 'text';
            input.value = c.number;
            input.className = 'edit-input';
            input.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    try {
                        await updateClassroom(c.id, { number: input.value });
                        nameSpan.textContent = input.value;
                        div.replaceChild(nameSpan, input);
                    } catch (err) {
                        alert('Ошибка при обновлении аудитории');
                    }
                }
                if (e.key === 'Escape') {
                    div.replaceChild(nameSpan, input);
                }
            };
            input.onblur = () => div.replaceChild(nameSpan, input);
            div.replaceChild(input, nameSpan);
            input.focus();
        };

        // --- Кнопка удаления ---
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = async () => {
            if (confirm('Удалить аудиторию?')) {
                try {
                    await deleteClassroom(c.id);
                    div.remove();
                } catch (err) {
                    alert('Ошибка при удалении аудитории');
                }
            }
        };

        div.appendChild(nameSpan);
        div.appendChild(delBtn);
        container.appendChild(div);
    });
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

        const nameSpan = document.createElement('span');
        nameSpan.textContent = p.name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = p.name;
            input.className = 'edit-input';
            input.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    try {
                        await updateProfessor(p.id || p.name, { name: input.value });
                        nameSpan.textContent = input.value;
                        div.replaceChild(nameSpan, input);
                    } catch (err) {
                        alert('Ошибка при обновлении преподавателя');
                    }
                }
                if (e.key === 'Escape') {
                    div.replaceChild(nameSpan, input);
                }
            };
            input.onblur = () => div.replaceChild(nameSpan, input);
            div.replaceChild(input, nameSpan);
            input.focus();
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = async () => {
            if (confirm('Удалить преподавателя?')) {
                try {
                    await deleteProfessor(Number(p.id || p.name)); // Преобразуем к числу
                    div.remove();
                } catch (err) {
                    alert('Ошибка при удалении преподавателя');
                }
            }
        };

        div.appendChild(nameSpan);
        div.appendChild(delBtn);
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

        const nameSpan = document.createElement('span');
        nameSpan.textContent = s.name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.onclick = () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = s.name;
            input.className = 'edit-input';
            input.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    try {
                        await updateSubject(s.id || s.name, { name: input.value });
                        nameSpan.textContent = input.value;
                        div.replaceChild(nameSpan, input);
                    } catch (err) {
                        alert('Ошибка при обновлении предмета');
                    }
                }
                if (e.key === 'Escape') {
                    div.replaceChild(nameSpan, input);
                }
            };
            input.onblur = () => div.replaceChild(nameSpan, input);
            div.replaceChild(input, nameSpan);
            input.focus();
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = async () => {
            if (confirm('Удалить предмет?')) {
                try {
                    await deleteSubject(Number(s.id || s.name)); // Преобразуем к числу
                    div.remove();
                } catch (err) {
                    alert('Ошибка при удалении предмета');
                }
            }
        };

        div.appendChild(nameSpan);
        div.appendChild(delBtn);
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
    // Удаляем эту строку, так как теперь это модальное окно
    // if (tabId === 'add-schedule-tab') setupScrollLoading('schedule-list', loadScheduleList);
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

        // Загружаем список расписаний в select
        await loadSchedules();

        // Устанавливаем активную вкладку при загрузке страницы (например, "Создать занятие")
        openTab('lesson-tab-content'); 

        // Загружаем расписание по умолчанию или последнее выбранное
        const initialScheduleId = localStorage.getItem('currentScheduleId');
        const initialFacultyId = localStorage.getItem('currentFacultyId');

        if (initialFacultyId) {
            document.getElementById('facultySelect').value = initialFacultyId;
            await loadSchedulesByFaculty();

            // Ждем загрузки расписаний и затем выбираем нужное
            setTimeout(() => {
                if (initialScheduleId) {
                    document.getElementById('scheduleSelect').value = initialScheduleId;
                    window.loadSchedule();
                }
            }, 500);
        }

        // Обработчики для модального окна создания расписания
        document.getElementById('create-schedule-submit').onclick = async () => {
            await window.addSchedule();
        };
        document.getElementById('create-schedule-cancel').onclick = closeCreateScheduleModal;

        // Обработчики для модального окна редактирования расписания
        document.getElementById('edit-schedule-submit').onclick = async () => {
            await window.editSchedule();
        };
        document.getElementById('edit-schedule-cancel').onclick = closeEditScheduleModal;

        // Обработчики для модального окна удаления расписания
        document.getElementById('delete-schedule-confirm').onclick = async () => {
            await window.deleteSchedule();
        };
        document.getElementById('delete-schedule-cancel').onclick = closeDeleteScheduleModal;

        // Обработчики для модального окна создания факультета
        document.getElementById('create-faculty-submit').onclick = async () => {
            await window.addFaculty();
        };
        document.getElementById('create-faculty-cancel').onclick = closeCreateFacultyModal;

        // Обработчики для модального окна редактирования факультета
        document.getElementById('edit-faculty-submit').onclick = async () => {
            await window.editFaculty();
        };
        document.getElementById('edit-faculty-cancel').onclick = closeEditFacultyModal;

        // Обработчики для модального окна удаления факультета
        document.getElementById('delete-faculty-confirm').onclick = async () => {
            await window.deleteFaculty();
        };
        document.getElementById('delete-faculty-cancel').onclick = closeDeleteFacultyModal;

    } catch (error) {
        console.error("Ошибка при загрузке приложения:", error);
    }
});