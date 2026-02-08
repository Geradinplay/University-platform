import { parseTimeToMinutes } from './utils.js';
import { createLesson } from './api.js'; 

export async function addNewLesson() {
    const subjectSelect = document.getElementById('subjectSelect');
    const teacherSelect = document.getElementById('teacherSelect');
    const classroomSelect = document.getElementById('classroomSelect');
    
    const subjectId = subjectSelect.value;
    const professorId = teacherSelect.value;
    const classroomId = classroomSelect.value;

    const selectedSubjectName = subjectSelect.options[subjectSelect.selectedIndex].textContent;
    const selectedTeacherName = teacherSelect.options[teacherSelect.selectedIndex].textContent;
    const selectedClassroomNumber = classroomSelect.options[classroomSelect.selectedIndex].textContent;
    
    const tm = document.getElementById('timeInput').value.trim();

    if (subjectId === "") {
        alert("Пожалуйста, выберите предмет.");
        return;
    }
    if (professorId === "") {
        alert("Пожалуйста, выберите преподавателя.");
        return;
    }
    if (classroomId === "") {
        alert("Пожалуйста, выберите аудиторию.");
        return;
    }
    if (!isValidTimeRange(tm)) {
        alert("Пожалуйста, введите время в корректном формате ЧЧ:ММ-ЧЧ:ММ (например, 09:00-10:00).");
        return;
    }

    const [startTimeStr, endTimeStr] = tm.split('-');
    // ДОБАВЛЕНО: Форматируем время в HH:MM с ведущими нулями
    function formatTime(t) {
        const [h, m] = t.trim().split(':').map(Number);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    const formattedStartTime = formatTime(startTimeStr);
    const formattedEndTime = formatTime(endTimeStr);

    const startMinutes = parseTimeToMinutes(formattedStartTime);
    const endMinutes = parseTimeToMinutes(formattedEndTime);

    if (startMinutes >= endMinutes) {
        alert("Время окончания занятия должно быть позже времени начала.");
        return;
    }

    const lessonData = {
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        day: 0, // Для буфера
        subjectId: Number(subjectId),    // Преобразуем к числу
        professorId: Number(professorId),
        classroomId: Number(classroomId)
    };

    try {
        const newLessonFromServer = await createLesson(lessonData);

        const id = "lesson-" + newLessonFromServer.id;
        const d = document.createElement('div');
        d.className = 'lesson'; d.id = id; d.draggable = true;
        d.ondragstart = window.drag;
        d.ondragover = window.allowDrop; 
        d.ondrop = window.drop; 
        d.dataset.day = newLessonFromServer.day;
        d.dataset.subjectId = newLessonFromServer.subject.id;
        d.dataset.professorId = newLessonFromServer.professor.id;
        d.dataset.classroomId = newLessonFromServer.classroom.id;
        // ДОБАВЛЕНО: Добавляем startTime и endTime в dataset для dragDropHandler
        d.dataset.startTime = newLessonFromServer.startTime;
        d.dataset.endTime = newLessonFromServer.endTime;


        d.innerHTML = `
            <div class="lesson-title">${newLessonFromServer.subject.name}</div>
            <div>${newLessonFromServer.professor.name}, ${newLessonFromServer.classroom.number}</div>
            <div class="lesson-time">${newLessonFromServer.startTime}-${newLessonFromServer.endTime}</div>
        `;
        // ИЗМЕНЕНО: Добавляем карточку в контейнер для буфера
        document.getElementById('buffer-content').appendChild(d); 

        // Очистка полей формы после создания карточки
        subjectSelect.value = '';
        teacherSelect.value = '';
        classroomSelect.value = '';
        document.getElementById('timeInput').value = '';

    } catch (error) {
        alert("Не удалось создать занятие: " + error.message);
        console.error("Error creating lesson in UI:", error);
    }
}

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