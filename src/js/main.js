import { populateSelect } from './utils/selectPopulator.js';
import { allowDrop, drag, drop } from './handlers/dragDropHandler.js';
import { addNewLesson } from './handlers/lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './handlers/contextMenuHandler.js';
import { connectionManager } from './utils/connectionManager.js';
import {
    getProfessors,
    getUsers,
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

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;
window.loadUsersList = function(page = 0) {
    return loadUsersList(page);
};

// ✅ НОВОЕ: Функции для работы с расписанием преподавателя
window.loadProfessorsList = loadProfessorsList;

// ===== ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ ДАННЫХ =====
window.professorsList = [];

// Функция для обновления кеша профессоров
window.updateProfessorsCache = async function() {
    try {
        console.log('🔄 updateProfessorsCache(): Обновляю кеш профессоров...');
        const professors = await getProfessors();
        window.professorsList = professors || [];
        console.log('✅ updateProfessorsCache(): Профессоров в кеше:', window.professorsList.length);
        if (window.professorsList.length > 0) {
            window.professorsList.forEach(p => {
                console.log('   - ' + p.username + ' (' + p.name + ')');
            });
        } else {
            console.warn('⚠️ updateProfessorsCache(): Кеш профессоров пуст!');
        }
        return window.professorsList;
    } catch (err) {
        console.error('❌ updateProfessorsCache(): Ошибка:', err);
        return [];
    }
};

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
    // Получаем данные из формы
    const username = document.getElementById('newUserUsername')?.value.trim();
    const name = document.getElementById('newUserName')?.value.trim();
    const email = document.getElementById('newUserEmail')?.value.trim();
    const password = document.getElementById('newUserPassword')?.value;

    // Валидация
    if (!username || username.length < 3) {
        alert('Username должен быть минимум 3 символа');
        return;
    }
    if (!name || name.length < 3) {
        alert('Полное имя должно быть минимум 3 символа');
        return;
    }
    if (!email || !email.includes('@')) {
        alert('Введите корректный email');
        return;
    }
    if (!password || password.length < 6) {
        alert('Пароль должен быть минимум 6 символов');
        return;
    }

    try {
        // Отправляем запрос на создание преподавателя
        const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, name, email, password, isProfessor: true })
        });

        if (response.ok) {
            const userData = await response.json();

            if (userData.isProfessor) {
                alert(`Пр��подаватель "${name}" успешно добавлен!`);
                // Очищаем форму
                document.getElementById('newUserUsername').value = '';
                document.getElementById('newUserName').value = '';
                document.getElementById('newUserEmail').value = '';
                document.getElementById('newUserPassword').value = '';

                // Обновляем список пользователей
                loadUsersList(0);
                // Обновляем select с преподавателями
                const professors = await getProfessors();
                populateSelect('teacherSelect', professors, 'username');
            } else {
                alert('Ошибка: пользователь был создан но не как преподаватель');
            }
        } else {
            const errData = await response.json();
            alert('Ошибка при добавлении преподавателя: ' + (errData.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error adding professor:', err);
        alert('Ошибка при добавлении преподавателя: ' + err.message);
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
        alert('Факультет добавлен!');
        await loadFaculties(); // Перезагрузить список факультетов
        // Очищаем поля ПОСЛЕ загрузки
        document.getElementById('createFacultyName').value = '';
        document.getElementById('createFacultyShortName').value = '';
        closeCreateFacultyModal(); // Закрыть модальное окно после создания
    } catch (err) {
        alert('Ошибка при добавлении факультета');
        console.error(err);
    }
};

window.addSchedule = async function() {
    const name = document.getElementById('createScheduleName').value.trim();
    const facultyId = parseInt(document.getElementById('createScheduleFacultyId').value);
    let semester = parseInt(document.getElementById('createScheduleSemester').value);
    const isExam = document.getElementById('createScheduleIsExam').checked;

    if (!name) {
        alert('Введите название расписания!');
        return;
    }
    if (isNaN(facultyId)) {
        alert('Выберите факультет!');
        return;
    }

    // Если семестр не указан, используем default значение 1
    if (isNaN(semester)) {
        semester = 1;
    }

    try {
        // Сохраняем текущий факультет ПЕРЕД загрузкой
        const currentFacultyId = document.getElementById('facultySelect').value;

        await createSchedule({ name, facultyId, semester, isExam });
        alert('Расписание добавлено!');
        await loadSchedules(); // Перезагрузить список расписаний

        // Восстанавливаем выбранный факультет
        if (currentFacultyId) {
            document.getElementById('facultySelect').value = currentFacultyId;
            await loadSchedulesByFaculty(); // Перезагружаем расписания для этого факультета
        }

        // Очищаем поля ПОСЛЕ загрузки
        document.getElementById('createScheduleName').value = '';
        document.getElementById('createScheduleFacultyId').value = '';
        document.getElementById('createScheduleSemester').value = '';
        document.getElementById('createScheduleIsExam').checked = false;
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
    document.getElementById('createScheduleSemester').value = '';
    document.getElementById('createScheduleIsExam').checked = false;
}

// Функции для управления модальным окном обновления расписания
window.openEditScheduleModal = async function() {
    const scheduleId = document.getElementById('scheduleSelect').value;
    const scheduleSelect = document.getElementById('scheduleSelect');

    if (!scheduleId) {
        alert('Пожалуйста, выберите расписание для обновления.');
        return;
    }

    // Получаем текущее имя расписания из select
    const scheduleName = scheduleSelect.options[scheduleSelect.selectedIndex].text;

    // Загружаем полную информацию о расписании (включая семестр)
    try {
        const schedule = await getScheduleById(scheduleId);

        // Заполняем форму
        document.getElementById('editScheduleName').value = schedule.name || scheduleName;
        document.getElementById('editScheduleSemester').value = schedule.semester || '';
        document.getElementById('editScheduleIsExam').checked = schedule.isExam || false;

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

        // Устанавливаем выбранный факультет
        editFacultySelect.value = schedule.facultyId || '';

        document.getElementById('edit-schedule-modal').classList.add('active');
    } catch (err) {
        alert('Ошибка при загрузке информации о расписании');
        console.error(err);
    }
};

function closeEditScheduleModal() {
    document.getElementById('edit-schedule-modal').classList.remove('active');
    document.getElementById('editScheduleName').value = '';
    document.getElementById('editScheduleFacultyId').value = '';
    document.getElementById('editScheduleIsExam').checked = false;
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
    let semester = parseInt(document.getElementById('editScheduleSemester').value);
    const isExam = document.getElementById('editScheduleIsExam').checked;

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

    // Если семестр не указан, используем default значение 1
    if (isNaN(semester)) {
        semester = 1;
    }

    try {
        await updateSchedule(scheduleId, { name, facultyId, semester, isExam });
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
        console.error('Ошибка при загр��зке факультетов:', error);
    }
}

async function loadSchedulesByFaculty() {
    try {
        const facultyId = document.getElementById('facultySelect').value;
        const scheduleSelect = document.getElementById('scheduleSelect');

        if (!facultyId) {
            scheduleSelect.innerHTML = '<option value="">-- Выберите расписание --</option>';
            scheduleSelect.value = '';
            // Очищаем доску и буфер при сбросе факультета
            document.getElementById('buffer-content').innerHTML = '<h2>Буфер</h2>';
            document.querySelectorAll('.table-container tbody td .day').forEach(dayContainer => {
                dayContainer.innerHTML = '';
            });
            return;
        }

        const schedules = await getSchedules();
        const filteredSchedules = schedules.filter(s => s.facultyId == facultyId);

        scheduleSelect.innerHTML = '<option value="">-- Выберите расписание --</option>';
        filteredSchedules.forEach(schedule => {
            const option = document.createElement('option');
            option.value = schedule.id;
            // Добавляем семестр в отображение с проверкой на null
            const semesterText = schedule.semester ? `(Семестр ${schedule.semester})` : '(Семестр не указан)';
            // Добавляем метку экзамена или распорядка
            const typeLabel = schedule.isExam ? '🔴 ЭКЗАМЕН' : '🔵 РАСПОРЯДОК';
            option.textContent = `${typeLabel} - ${schedule.name} ${semesterText}`;
            scheduleSelect.appendChild(option);
        });

        // Очищаем выбранное значение
        scheduleSelect.value = '';
        // Очищаем доску и буфер при смене факультета
        document.getElementById('buffer-content').innerHTML = '<h2>Буфер</h2>';
        document.querySelectorAll('.table-container tbody td .day').forEach(dayContainer => {
            dayContainer.innerHTML = '';
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

/**
 * Загружает и отображает расписание для выбранного ID
 * Получает занятия и перерывы, отображает их на доске
 */
window.loadSchedule = async function() {
    try {
        const scheduleId = document.getElementById('scheduleSelect').value;

        if (!scheduleId) {
            console.warn('⚠️ Расписание не выбрано');
            // Очищаем доску и буфер
            document.getElementById('buffer-content').innerHTML = '<h2>Буфер</h2>';
            document.querySelectorAll('.table-container tbody td .day').forEach(dayContainer => {
                dayContainer.innerHTML = '';
            });
            return;
        }

        console.log('📖 Загружаю расписание с ID:', scheduleId);

        // Сохраняем текущее расписание в localStorage
        localStorage.setItem('currentScheduleId', scheduleId);

        // Очищаем доску и буфер перед загрузкой
        const bufferContent = document.getElementById('buffer-content');
        bufferContent.innerHTML = '<h2>Буфер</h2>';
        const dayContainers = document.querySelectorAll('.table-container tbody td .day');
        dayContainers.forEach(dayContainer => {
            dayContainer.innerHTML = '';
        });

        // Загружаем занятия для расписания
        const lessons = await getLessonsByScheduleId(scheduleId);
        console.log('📚 Загружено занятий:', lessons.length);

        // Загружаем перерывы
        const breaks = await getBreaks(scheduleId);
        console.log('⏸️ Загружено перерывов:', breaks.length);

        // --- Добавление занятий ---
        lessons.forEach(lessonData => {
            // Проверка на корректность данных урока
            // Поле professor может быть либо professor, либо user в зависимости от API
            const professor = lessonData.professor || lessonData.user;
            if (!lessonData || !lessonData.id || !lessonData.subject || !professor || !lessonData.classroom || !lessonData.startTime || !lessonData.endTime) {
                console.warn('⚠️ Пропуск некорректного занятия:', lessonData);
                return;
            }

            let targetContainer;
            if (lessonData.day === 0) {
                targetContainer = bufferContent; // Целевой контейнер для буфера
            } else if (lessonData.day >= 1 && lessonData.day <= dayContainers.length) {
                targetContainer = dayContainers[lessonData.day - 1]; // Получаем div .day внутри td
            } else {
                console.warn(`⚠️ Пропуск занятия ${lessonData.id} с неверным днём: ${lessonData.day}`);
                return;
            }

            if (!targetContainer) {
                console.warn(`⚠️ Контейнер не найден для занятия ${lessonData.id}, день ${lessonData.day}`);
                return;
            }

            const d = document.createElement('div');
            d.className = 'lesson';
            d.id = "lesson-" + lessonData.id;
            d.dataset.lessonId = lessonData.id;  // ✅ НОВОЕ: для проверки дубликатов
            d.draggable = true;
            d.ondragstart = window.drag;
            d.ondragover = window.allowDrop;
            d.ondrop = window.drop;
            d.dataset.day = lessonData.day;
            d.dataset.subjectId = lessonData.subject.id;
            d.dataset.professorId = professor.id;
            d.dataset.classroomId = lessonData.classroom.id;
            d.dataset.startTime = lessonData.startTime;
            d.dataset.endTime = lessonData.endTime;

            const infoString = `${professor.name}, ${lessonData.classroom.number}`;
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

        // --- Добавление перерывов из базы ---
        breaks.forEach(breakData => {
            if (!breakData || !breakData.id || !breakData.day || !breakData.startTime || !breakData.endTime) return;

            let targetContainer;
            if (breakData.day === 0) {
                targetContainer = bufferContent;
            } else if (breakData.day >= 1 && breakData.day <= dayContainers.length) {
                targetContainer = dayContainers[breakData.day - 1];
            } else {
                return;
            }

            const b = document.createElement('div');
            b.className = 'break-block';
            b.id = "break-" + breakData.id;
            const duration = parseTimeToMinutes(breakData.endTime) - parseTimeToMinutes(breakData.startTime);
            b.innerText = `ПЕРЕРЫВ: ${duration} МИН. (${breakData.startTime}-${breakData.endTime})`;
            b.dataset.breakId = breakData.id;
            b.dataset.day = breakData.day;
            b.dataset.startTime = breakData.startTime;
            b.dataset.endTime = breakData.endTime;
            b.dataset.duration = duration;
            b.draggable = true;
            b.ondragstart = window.drag;
            b.ondragover = window.allowDrop;
            b.ondrop = window.drop;

            // Добавляем перерыв в порядке времени (независимо от занятий)
            const breakStartTime = parseTimeToMinutes(breakData.startTime);
            let insertReferenceNode = null;

            for (const child of Array.from(targetContainer.children)) {
                if (child.dataset.startTime) {
                    const childStartTime = parseTimeToMinutes(child.dataset.startTime);
                    if (breakStartTime < childStartTime) {
                        insertReferenceNode = child;
                        break;
                    }
                }
            }
            targetContainer.insertBefore(b, insertReferenceNode);
        });

        console.log('✅ Расписание успешно загружено');
    } catch (error) {
        console.error('❌ Ошибка при загрузке расписания:', error);
        alert('Ошибка при загрузке расписания: ' + error.message);
    }
};

async function loadSchedules() {
    // Сохраняем текущий выбранный факультет
    const selectedFacultyId = document.getElementById('facultySelect').value;
    await loadFaculties();
    // Восстанавливаем выбранный факультет после загрузки
    if (selectedFacultyId) {
        document.getElementById('facultySelect').value = selectedFacultyId;
    }
}

// ===== НОВЫЕ ФУНКЦИИ ДЛЯ РАСПИСАНИЯ ПРЕПОДАВАТЕЛЯ =====

/**
 * Загружает список всех преподавателей в select
 */
async function loadProfessorsList() {
    try {
        const professorSelect = document.getElementById('professorSelect');
        if (!professorSelect) return;

        const professors = await getProfessors();
        professorSelect.innerHTML = '<option value="">-- Выберите преподавателя --</option>';

        professors.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = prof.name || prof.username;
            professorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке списка преподавателей:', error);
    }
}

/**
 * Отображает расписание выбранного преподавателя красными блоками
 */
window.loadProfessorSchedule = async function() {
    try {
        const professorId = document.getElementById('professorSelect').value;

        if (!professorId) {
            alert('Пожалуйста, выберите преподавателя');
            return;
        }

        console.log('📚 Загружаю расписание преподавателя с ID:', professorId);

        // Получаем все расписания
        const schedules = await getSchedules();

        // Для каждого расписания ищем занятия этого преподавателя
        let allLessons = [];

        for (const schedule of schedules) {
            try {
                const lessons = await getLessonsByScheduleId(schedule.id);
                allLessons = allLessons.concat(lessons.filter(l => l.user.id == professorId));
            } catch (err) {
                // Игнорируем ошибки при загрузке отдельных расписаний
            }
        }

        console.log('🎓 Найдено занятий преподавателя:', allLessons.length);

        // Очищаем старые блоки преподавателя
        document.querySelectorAll('.professor-busy').forEach(block => block.remove());

        if (allLessons.length === 0) {
            alert('У этого преподавателя нет занятий в расписаниях');
            return;
        }

        // Отображаем занятия красными блоками
        const dayContainers = document.querySelectorAll('.day');

        allLessons.forEach(lesson => {
            const dayIndex = lesson.day - 1;
            if (dayIndex >= 0 && dayIndex < dayContainers.length) {
                const dayContainer = dayContainers[dayIndex];

                // ✅ НОВОЕ: Проверяем не является ли это уже существующим блоком на расписании
                // Ищем обычный синий блок этого же занятия несколькими методами
                let existingLessonBlock = document.getElementById(`lesson-${lesson.id}`);
                if (!existingLessonBlock) {
                    existingLessonBlock = dayContainer.querySelector(`[data-lesson-id="${lesson.id}"]`);
                }
                if (!existingLessonBlock) {
                    existingLessonBlock = dayContainer.querySelector(`.lesson[id*="lesson-"][data-lesson-id="${lesson.id}"]`);
                }

                if (existingLessonBlock) {
                    // Это уже существующее занятие из текущего расписания - пропускаем
                    console.log(`⏭️  Пропускаю блок ${lesson.id} - уже отображается на расписании`);
                    return;
                }

                // Создаем красный блок занятости
                const busyBlock = document.createElement('div');
                busyBlock.className = 'professor-busy';
                busyBlock.dataset.professorId = professorId;
                busyBlock.style.backgroundColor = '#ffcccc'; // Очень светлый красный
                busyBlock.style.borderLeft = '4px solid #dc3545'; // Красная граница
                busyBlock.style.color = '#c82333'; // Темный красный текст
                busyBlock.style.padding = '8px';
                busyBlock.style.marginBottom = '8px';
                busyBlock.style.borderRadius = '6px';
                busyBlock.style.fontSize = '12px';
                busyBlock.style.fontWeight = 'bold';
                busyBlock.style.boxShadow = '0 1px 5px rgba(220, 53, 69, 0.2)';
                busyBlock.style.pointerEvents = 'none'; // Не реагирует на клики

                busyBlock.innerHTML = `
                    <div style="font-weight: bold; color: #dc3545;">🔴 ЗАНЯТО</div>
                    <div style="margin-top: 4px; font-size: 11px;">
                        ${lesson.startTime} - ${lesson.endTime}<br>
                        ${lesson.subject.name}<br>
                        Каб. ${lesson.classroom.number}
                    </div>
                `;

                dayContainer.appendChild(busyBlock);
            }
        });

        console.log('✅ Расписание преподавателя успешно отображено');
        alert(`✅ Отображены ${allLessons.length} занятий преподавателя`);

    } catch (error) {
        console.error('❌ Ошибка при загрузке расписания преподавателя:', error);
        alert('Ошибка при загрузке расписания: ' + error.message);
    }
};

/**
 * Очищает красные блоки занятости преподавателя
 */
window.clearProfessorSchedule = function() {
    console.log('🧹 Очищаю красные блоки занятости преподавателя');
    document.querySelectorAll('.professor-busy').forEach(block => block.remove());
    document.getElementById('professorSelect').value = '';
    console.log('✅ Блоки очищены');
};

async function loadScheduleList(page = 0, pageSize = 50) {
    const schedules = await getSchedules();
    const container = document.getElementById('schedule-list');
    if (!container) return;
    if (page === 0) container.innerHTML = '';
    const slice = schedules.slice(page * pageSize, (page + 1) * pageSize);
    slice.forEach(s => {
        const div = document.createElement('div');
        div.className = 'scroll-list-item';

        // Создаем контейнер для метки и имени
        const labelAndName = document.createElement('span');
        labelAndName.style.display = 'flex';
        labelAndName.style.alignItems = 'center';
        labelAndName.style.gap = '8px';
        labelAndName.style.flex = '1';

        // Добавляем метку типа расписания
        const typeLabel = document.createElement('span');
        if (s.isExam) {
            typeLabel.textContent = '🔴 ЭКЗАМЕН';
            typeLabel.style.color = '#dc3545';
            typeLabel.style.fontWeight = 'bold';
            typeLabel.style.fontSize = '12px';
        } else {
            typeLabel.textContent = '🔵 РАСПОРЯДОК';
            typeLabel.style.color = '#5b9bd5';
            typeLabel.style.fontWeight = 'bold';
            typeLabel.style.fontSize = '12px';
        }
        labelAndName.appendChild(typeLabel);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = s.name;
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.flex = '1';

        nameSpan.onclick = () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = s.name;
            input.className = 'edit-input';
            input.onkeydown = async (e) => {
                if (e.key === 'Enter') {
                    try {
                        await updateSchedule(s.id, { name: input.value, facultyId: s.facultyId, semester: s.semester, isExam: s.isExam });
                        nameSpan.textContent = input.value;
                        labelAndName.replaceChild(nameSpan, input);
                        loadSchedules(); // Обновить список выбора расписаний
                    } catch (err) {
                        alert('Ошибка при обновлении расписания');
                    }
                }
                if (e.key === 'Escape') {
                    labelAndName.replaceChild(nameSpan, input);
                }
            };
            input.onblur = () => labelAndName.replaceChild(nameSpan, input);
            labelAndName.replaceChild(input, nameSpan);
            input.focus();
        };

        labelAndName.appendChild(nameSpan);

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

        div.appendChild(labelAndName);
        div.appendChild(delBtn);
        container.appendChild(div);
    });
    return schedules.length > (page + 1) * pageSize;
}

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
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '10px';
        div.style.border = '1px solid #ddd';
        div.style.borderRadius = '5px';
        div.style.marginBottom = '8px';

        // Информация о преподавателе (username, name, email)
        const infoDiv = document.createElement('div');
        infoDiv.style.flex = '1';
        infoDiv.style.cursor = 'pointer';

        // Username (полужирный)
        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = p.username || p.name;
        usernameSpan.style.fontWeight = 'bold';
        usernameSpan.style.marginRight = '10px';
        usernameSpan.style.fontSize = '16px';

        // Full name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = p.name;
        nameSpan.style.marginRight = '10px';
        nameSpan.style.color = '#555';

        // Email
        const emailSpan = document.createElement('span');
        emailSpan.textContent = p.email ? `(${p.email})` : '';
        emailSpan.style.color = '#999';
        emailSpan.style.fontSize = '12px';

        infoDiv.appendChild(usernameSpan);
        infoDiv.appendChild(document.createElement('br'));
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(emailSpan);

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Изменить';
        editBtn.style.marginRight = '5px';
        editBtn.onclick = () => {
            const newName = prompt('Новое полное имя:', p.name);
            if (newName) {
                try {
                    updateProfessor(p.id, { name: newName });
                    nameSpan.textContent = newName;
                } catch (err) {
                    alert('Ошибка при обновлении преподавателя');
                }
            }
        };

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'Удалить';
        delBtn.onclick = async () => {
            if (confirm(`Удалить преподавателя "${p.name}" (${p.username})?`)) {
                try {
                    await deleteProfessor(p.id);
                    div.remove();
                } catch (err) {
                    alert('Ошибка при удалении преподавателя');
                }
            }
        };

        div.appendChild(infoDiv);
        div.appendChild(editBtn);
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

async function loadUsersList(page = 0, pageSize = 50) {
    try {
        const users = await getUsers();
        const container = document.getElementById('users-list');
        if (!container) return;
        if (page === 0) container.innerHTML = '';

        const slice = users.slice(page * pageSize, (page + 1) * pageSize);
        slice.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '12px';
            div.style.marginBottom = '8px';
            div.style.border = '1px solid #ddd';
            div.style.borderRadius = '5px';
            div.style.backgroundColor = user.isProfessor ? '#fff3cd' : '#f8f9fa';

            // Информация о пользователе
            const infoDiv = document.createElement('div');
            infoDiv.style.flex = '1';

            // Username (полужирный)
            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = user.username;
            usernameSpan.style.fontWeight = 'bold';
            usernameSpan.style.fontSize = '14px';
            usernameSpan.style.marginRight = '10px';

            // Full name и role
            const detailsSpan = document.createElement('span');
            detailsSpan.textContent = `${user.name} (${user.role})`;
            detailsSpan.style.color = '#555';
            detailsSpan.style.fontSize = '13px';
            detailsSpan.style.marginRight = '10px';

            // Email (СКРЫТО)
            // const emailSpan = document.createElement('span');
            // emailSpan.textContent = user.email || '';
            // emailSpan.style.color = '#999';
            // emailSpan.style.fontSize = '12px';

            infoDiv.appendChild(usernameSpan);
            infoDiv.appendChild(detailsSpan);
            // infoDiv.appendChild(emailSpan);

            // Переключатель isProfessor
            const toggleDiv = document.createElement('div');
            toggleDiv.style.display = 'flex';
            toggleDiv.style.alignItems = 'center';
            toggleDiv.style.gap = '8px';

            const label = document.createElement('label');
            label.textContent = 'Профессор:';
            label.style.marginRight = '5px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = user.isProfessor || false;
            checkbox.style.width = '20px';
            checkbox.style.height = '20px';
            checkbox.style.cursor = 'pointer';
            checkbox.onchange = async () => {
                try {
                    console.log(`🔄 Обновляю isProfessor для пользователя ${user.id}, новое значение: ${checkbox.checked}`);
                    console.log('👤 Полные данные пользователя:', user);
                    // Отправляем полный объект пользователя с обновленным полем
                    const updatedUser = {
                        ...user,
                        isProfessor: checkbox.checked
                    };
                    console.log('📤 Отправляю обновленные данные:', updatedUser);
                    const response = await updateProfessor(user.id, updatedUser);
                    console.log('✅ Ответ сервера:', response);
                    console.log('✅ Профессор успешно обновлен');
                    // Обновляем фон
                    div.style.backgroundColor = checkbox.checked ? '#fff3cd' : '#f8f9fa';
                    // Перезагружаем список пользователей с нулевой страницей
                    console.log('🔄 Перезагружаю список пользователей...');
                    await loadUsersList(0);
                    // Обновляем список селектов преподавателей
                    const professors = await getProfessors();
                    populateSelect('teacherSelect', professors, 'username');
                } catch (err) {
                    console.error('❌ Ошибка при обновлении статуса профессора:', err);
                    console.error('❌ Полная ошибка:', err.message);
                    checkbox.checked = !checkbox.checked;
                    alert('Ошибка при обновлении статуса профессора: ' + err.message);
                }
            };

            toggleDiv.appendChild(label);
            toggleDiv.appendChild(checkbox);

            // Кнопка удалить
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Удалить';
            delBtn.className = 'delete-btn';
            delBtn.style.marginLeft = '10px';
            delBtn.onclick = async () => {
                if (confirm(`Удалить пользователя "${user.username}"?`)) {
                    try {
                        await apiRequest(`/api/users/${user.id}`, { method: 'DELETE' });
                        div.remove();
                        // Обновляем списки
                        const professors = await getProfessors();
                        populateSelect('teacherSelect', professors, 'username');
                    } catch (err) {
                        alert('Ошибка при удалении пользователя');
                    }
                }
            };

            div.appendChild(infoDiv);
            div.appendChild(toggleDiv);
            div.appendChild(delBtn);
            container.appendChild(div);
        });

        return users.length > (page + 1) * pageSize;
    } catch (err) {
        console.error('Error loading users list:', err);
    }
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
    if (tabId === 'add-professor-tab') {
        setupScrollLoading('professor-list', loadProfessorList);
        // Загружаем список пользователей
        setupScrollLoading('users-list', loadUsersList);
        // Инициальная загрузка пользователей
        loadUsersList(0);
    }
    if (tabId === 'add-subject-tab') setupScrollLoading('subject-list', loadSubjectList);
    // Удаляем эту строку, так как теперь это модальное окно
    // if (tabId === 'add-schedule-tab') setupScrollLoading('schedule-list', loadScheduleList);
};

// Функция инициализации приложения
async function initializeApp() {
    console.log('🔄 Инициализирую приложение...');

    const subjects = await getSubjects();
    console.log('📚 Получены предметы:', subjects?.length || 0);
    populateSelect('subjectSelect', subjects, 'name');

    // ✅ ОБНОВЛЯЕМ КЕШ ПРОФЕССОРОВ - это загружает ВСЕ профессоров
    await window.updateProfessorsCache();
    console.log('👨‍🏫 Кеш профессоров обновлен:', window.professorsList.length);
    populateSelect('teacherSelect', window.professorsList, 'name');
    console.log('✅ teacherSelect заполнен профессорами:', window.professorsList.length);

    const classrooms = await getClassrooms();
    console.log('🏫 Получены аудитории:', classrooms?.length || 0);
    populateSelect('classroomSelect', classrooms, 'number');

    setupContextMenu();

    // Загружаем список расписаний в select
    await loadSchedules();

    // ✅ НОВОЕ: Загружаем список преподавателей для выбора расписания преподавателя
    await loadProfessorsList();
    console.log('👨‍🏫 Список преподавателей загруже��');

    // Устанавливаем активную вкладку при загрузке страницы (например, "Создать занятие")
    window.openTab('lesson-tab-content');

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
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔄 DOMContentLoaded: Запускаю ConnectionManager...');
        // Используем ConnectionManager для управления подключением
        await connectionManager.initialize(initializeApp);
    } catch (error) {
        console.error("❌ Критическая ошибка при загрузке приложения:", error);
        // Даже при критической ошибке устанавливаем обработчики переподключения
        connectionManager.setupReconnectionCheck(initializeApp);
    }
});

