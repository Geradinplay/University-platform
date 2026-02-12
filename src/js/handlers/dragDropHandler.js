/**
 * ================================================
 * DRAG & DROP HANDLER - Обработчик перетаскивания
 * ================================================
 */

import { checkCollision } from '../utils/collisionDetector.js';
import { parseTimeToMinutes } from '../utils/utils.js';
import { updateLessonDay, createBreak, updateBreak, getSchedules, getLessonsByScheduleId, getScheduleById } from '../../../api/api.js';
import { showModal, showConflictConfirmationModal } from '../modal.js'; // Импортируем showModal и showConflictConfirmationModal

let draggedElement = null;

// Экспортируем функции в window для использования в HTML
window.drag = drag;
window.allowDrop = allowDrop;
window.drop = drop;

/**
 * Разрешает сброс и подсвечивает зону
 */
export function allowDrop(ev) {
    ev.preventDefault();
    // Находим корректный контейнер для подсветки
    const day = ev.target.closest('.day');
    const buffer = ev.target.closest('#buffer-content');
    const td = ev.target.closest('td');
    const target = day || buffer || (td?.querySelector('.day')) || (ev.currentTarget.classList.contains('dropzone') ? ev.currentTarget.querySelector('.day') || ev.currentTarget : null);
    if (target) {
        (target.classList?.contains('day') ? target : target.querySelector?.('.day') || target).style.backgroundColor = '#eef4f8';
    }
}

/**
 * Очистка стилей после завершения перетаскивания
 */
document.addEventListener('dragend', () => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    document.querySelectorAll('.dropzone, .day, #buffer-content').forEach(el => {
        el.style.backgroundColor = '';
    });
});

/**
 * Начало перетаскивания
 */
export function drag(ev) {
    draggedElement = ev.target;
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging');
}

/**
 * Основная логика сброса (Drop)
 */
export async function drop(ev) {
    ev.preventDefault();

    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);
    if (!el) return;

    // Снимаем подсветку
    document.querySelectorAll('.dropzone, .day, #buffer-content').forEach(target => target.style.backgroundColor = '');

    // Находим целевой .day контейнер максимально надёжно
    let targetContainer = ev.target.closest('.day')
        || ev.target.closest('#buffer-content')
        || (ev.target.closest('td')?.querySelector('.day'))
        || (ev.currentTarget.classList.contains('dropzone') ? ev.currentTarget.querySelector('.day') : null);
    if (!targetContainer) return;

    const isToBuffer = targetContainer.id === 'buffer-content' || targetContainer.closest('#buffer-content');
    const newDay = isToBuffer ? 0 : parseInt(targetContainer.dataset.dayIndex);
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null;

    // Функция для названия дня
    const getDayNameLocal = (d) => ({1:'Понедельник',2:'Вторник',3:'Среда',4:'Четверг',5:'Пятница'})[d] || String(d);

    // --- ЛОГИКА ДЛЯ ПЕРЕРЫВА (BREAK-BLOCK) ---
    if (el.classList.contains('break-block')) {
        if (!isToBuffer) {
            const breakTimeStr = `${el.dataset.startTime}-${el.dataset.endTime}`;
            const allowCollision = document.getElementById('settings-content')?.querySelector('#allowCollision')?.checked || false;

            if (!allowCollision && checkCollision(breakTimeStr, targetContainer, el.id)) {
                alert("Ошибка! В это время уже есть другое занятие или перерыв.");
                return;
            }
            sortAndInsert(targetContainer, el);
        } else {
            targetContainer.appendChild(el);
        }

        if (oldDay !== newDay) {
            el.dataset.day = newDay;
            await updateBreakOnServer(el, newDay);
        }
        return;
    }

    // --- ЛОГИКА ДЛЯ ЗАНЯТИЯ (LESSON) ---
    if (el.classList.contains('lesson')) {
        const lessonId = el.id.replace('lesson-', '');

        if (!isToBuffer) {
            const timeStr = el.querySelector('.lesson-time').innerText;
            const allowCollision = document.getElementById('settings-content')?.querySelector('#allowCollision')?.checked || false;

            // БАЗОВАЯ проверка пересечения времени
            if (checkCollision(timeStr, targetContainer, el.id)) {
                if (!allowCollision) {
                    // Пересечения запрещены — просто информируем и отменяем перенос
                    showModal('Ошибка перетаскивания', `В ${getDayNameLocal(newDay)} уже есть другое занятие в это время.`);
                    return;
                } else {
                    // Пересечения разрешены — позволяем подтвердить добавление
                    showConflictConfirmationModal(
                        `В ${getDayNameLocal(newDay)} уже есть другое занятие в это время.`,
                        async () => {
                            await proceedWithLessonDrop(el, targetContainer, isToBuffer, newDay, oldDay, lessonId);
                        },
                        () => {
                            console.log('Перетаскивание отменено из-за базовой коллизии времени.');
                        }
                    );
                    return;
                }
            }

            // Проверка занятости кабинетов и профессоров в текущем дне/контейнере
            const checkClassroomBusy = document.getElementById('checkClassroomBusy')?.checked;
            const checkProfessorBusy = document.getElementById('checkProfessorBusy')?.checked || false;

            if (checkClassroomBusy || checkProfessorBusy) {
                const [startTimeStr, endTimeStr] = timeStr.split('-');
                const startMin = parseTimeToMinutes(startTimeStr.trim());
                const endMin = parseTimeToMinutes(endTimeStr.trim());

                const lessonClassroomId = el.dataset.classroomId;
                const lessonProfessorId = el.dataset.professorId;

                // Получаем все занятия в целевом контейнере
                const dayLessons = targetContainer.querySelectorAll('.lesson');
                let conflictMessages = [];

                dayLessons.forEach(otherLesson => {
                    if (otherLesson === el) return; // Пропускаем самого себя

                    const otherTimeStr = otherLesson.querySelector('.lesson-time').innerText;
                    const [otherStartStr, otherEndStr] = otherTimeStr.split('-');
                    const otherStartMin = parseTimeToMinutes(otherStartStr.trim());
                    const otherEndMin = parseTimeToMinutes(otherEndStr.trim());

                    // Проверяем пересечение времени
                    const hasTimeConflict = !(endMin <= otherStartMin || startMin >= otherEndMin);

                    if (hasTimeConflict) {
                        if (checkClassroomBusy && lessonClassroomId === otherLesson.dataset.classroomId) {
                            const classroomNumber = otherLesson.dataset.classroomNumber || otherLesson.textContent.match(/\d+/)?.[0] || 'неизвестного';
                            conflictMessages.push(`❌ В ${getDayNameLocal(newDay)} каб. ${classroomNumber} уже занят в это время (${otherTimeStr})`);
                        }

                        if (checkProfessorBusy && lessonProfessorId === otherLesson.dataset.professorId) {
                            const professorName = otherLesson.dataset.professorName || otherLesson.textContent.split(',')[0] || 'неизвестный преподаватель';
                            conflictMessages.push(`❌ В ${getDayNameLocal(newDay)} преподаватель ${professorName} уже занят в это время (${otherTimeStr})`);
                        }
                    }
                });

                // При переносе из буфера также проверяем коллизии в других расписаниях
                if (oldDay === 0) {
                    const globalConflicts = await checkGlobalConflicts({
                        day: newDay,
                        startMin,
                        endMin,
                        professorId: checkProfessorBusy ? lessonProfessorId : null,
                        classroomId: checkClassroomBusy ? lessonClassroomId : null,
                    });
                    conflictMessages = conflictMessages.concat(globalConflicts.map(msg => `(${getDayNameLocal(newDay)}) ${msg}`));
                }

                if (conflictMessages.length > 0) {
                    if (!allowCollision) {
                        // Пересечения запрещены — показываем информативную модалку и отменяем перенос
                        showModal('Конфликт расписания', conflictMessages.join('\n'));
                        return;
                    } else {
                        // Пересечения разрешены — спрашиваем подтверждение
                        showConflictConfirmationModal(
                            conflictMessages.join('<br>'),
                            async () => {
                                await proceedWithLessonDrop(el, targetContainer, isToBuffer, newDay, oldDay, lessonId);
                            },
                            () => {
                                console.log('Перетаскивание отменено из-за конфликта занятости.');
                            }
                        );
                        return;
                    }
                }
            }
        }

        // Если нет конфликтов или они были проигнорированы через модальное окно, продолжаем
        await proceedWithLessonDrop(el, targetContainer, isToBuffer, newDay, oldDay, lessonId);
    }
}

// Вспомогательная функция для продолжения логики drop после обработки конфликтов
async function proceedWithLessonDrop(el, targetContainer, isToBuffer, newDay, oldDay, lessonId) {
    if (isToBuffer) {
        targetContainer.appendChild(el);
        el.dataset.breakCreated = '';
        console.log(`📦 Lesson ${lessonId} перемещен в буфер`);
    } else {
        sortAndInsert(targetContainer, el);
        console.log(`📅 Lesson ${lessonId} перемещен в день ${newDay}`);

        const breakToggle = document.getElementById('settings-content')?.querySelector('#breakToggle')?.checked;
        const hasBreakAhead = el.nextElementSibling?.classList.contains('break-block');

        // Создаем новый перерыв ТОЛЬКО если:
        // 1. Галочка включена
        // 2. Занятие из буфера (oldDay === 0)
        // 3. После занятия нет перерыва
        if (breakToggle && oldDay === 0 && !hasBreakAhead) {
            console.log(`⏳ Создаем новый перерыв для lesson ${lessonId} в дне ${newDay}`);
            await handleBreakCreation(el, targetContainer, newDay, lessonId);
        }
    }

    if (oldDay !== newDay) {
        el.dataset.day = newDay;
        await updateLessonOnServer(el, lessonId, newDay);
    }

    // Если открыт вид занятости комнат — обновим таблицу
    const classroomView = document.getElementById('classroom-view');
    if (classroomView && getComputedStyle(classroomView).display !== 'none' && typeof window.loadClassroomScheduleView === 'function') {
        try {
            await window.loadClassroomScheduleView();
        } catch (e) {
            console.warn('Не удалось обновить таблицу занятости комнат:', e);
        }
    }
}

// ================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ================================================

function sortAndInsert(container, element) {
    const startMinutes = parseTimeToMinutes(element.dataset.startTime);
    let referenceNode = null;

    for (const child of Array.from(container.children)) {
        if (child !== element && child.dataset.startTime) {
            if (startMinutes < parseTimeToMinutes(child.dataset.startTime)) {
                referenceNode = child;
                break;
            }
        }
    }
    container.insertBefore(element, referenceNode);
}

async function handleBreakCreation(lessonEl, container, day, lessonId) {
    const duration = document.getElementById('settings-content')?.querySelector('#breakDuration')?.value || 10;
    const startMin = parseTimeToMinutes(lessonEl.dataset.endTime);
    const endStr = minutesToTime(startMin + parseInt(duration));

    try {
        const res = await createBreak({
            day,
            startTime: lessonEl.dataset.endTime,
            endTime: endStr,
            duration: parseInt(duration),
            positionAfterLessonId: parseInt(lessonId),
            scheduleId: Number(localStorage.getItem('currentScheduleId') || 1)
        });

        const b = document.createElement('div');
        b.className = 'break-block';
        b.id = "break-" + res.id;
        b.innerText = `ПЕРЕРЫВ: ${duration} МИН. (${res.startTime}-${res.endTime})`;

        Object.assign(b.dataset, {
            breakId: res.id, day, startTime: res.startTime, endTime: res.endTime, duration: res.duration
        });

        b.draggable = true;
        b.ondragstart = window.drag;
        b.ondragover = window.allowDrop;
        b.ondrop = window.drop;

        container.insertBefore(b, lessonEl.nextSibling);
        lessonEl.dataset.breakCreated = 'true';
    } catch (e) {
        console.error("Ошибка при создании перерыва:", e);
    }
}

function minutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * Обновление занятия на сервере
 */
async function updateLessonOnServer(el, id, day) {
    try {
        const payload = {
            startTime: el.dataset.startTime,
            endTime: el.dataset.endTime,
            day: day,
            subjectId: Number(el.dataset.subjectId),
            userId: Number(el.dataset.professorId),  // Используем userId вместо professorId
            classroomId: Number(el.dataset.classroomId),
            scheduleId: Number(localStorage.getItem('currentScheduleId') || 1)
        };

        await updateLessonDay(id, payload);
        console.log(`Lesson ${id} обновлен на сервере: day=${day}`);
    } catch (e) {
        console.error("Ошибка при обновлении занятия на сервере:", e);
    }
}

async function updateBreakOnServer(el, day) {
    try {
        await updateBreak(el.dataset.breakId, {
            day,
            startTime: el.dataset.startTime,
            endTime: el.dataset.endTime,
            duration: el.dataset.duration,
            scheduleId: Number(localStorage.getItem('currentScheduleId') || 1)
        });
    } catch (e) {
        console.error("Ошибка при обновлении перерыва на сервере:", e);
    }
}

// Проверка пересечения интервалов времени
function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
    return !(aEnd <= bStart || aStart >= bEnd);
}

// Глобальная проверка коллизий в других расписаниях (профессор/аудитория)
async function checkGlobalConflicts({ day, startMin, endMin, professorId, classroomId }) {
    try {
        const conflicts = [];
        // Определяем тип текущего расписания (экзамены/учебное)
        const currentScheduleId = Number(localStorage.getItem('currentScheduleId') || 0);
        let currentIsExam = null;
        if (currentScheduleId) {
            try {
                const curSch = await getScheduleById(currentScheduleId);
                currentIsExam = !!curSch?.isExam;
            } catch (e) {
                console.warn('Не удалось получить текущий тип расписания:', e);
            }
        }
        const schedules = await getSchedules();
        for (const sch of (schedules || [])) {
            // Если известно, какой тип текущего расписания — проверяем конфликты только в расписаниях того же типа
            if (currentIsExam !== null && !!sch.isExam !== currentIsExam) {
                continue;
            }
            try {
                const lessons = await getLessonsByScheduleId(sch.id);
                for (const l of (lessons || [])) {
                    const lDay = Number(l.day);
                    if (lDay !== day) continue;
                    const otherStartMin = parseTimeToMinutes(l.startTime);
                    const otherEndMin = parseTimeToMinutes(l.endTime);
                    if (!intervalsOverlap(startMin, endMin, otherStartMin, otherEndMin)) continue;
                    const otherProfessorId = String(l.user?.id || l.professor?.id || '');
                    const otherClassroomId = String(l.classroom?.id || l.classroomId || '');
                    if (professorId && otherProfessorId && String(professorId) === String(otherProfessorId)) {
                        conflicts.push(`❌ Преподаватель ${l.user?.name || l.professor?.name || 'неизвестный'} имеет занятие ${l.subject?.name || ''} в ${l.classroom?.number || ''} (${l.startTime}-${l.endTime}) в расписании "${sch.name}"`);
                    }
                    if (classroomId && otherClassroomId && String(classroomId) === String(otherClassroomId)) {
                        conflicts.push(`❌ Кабинет ${l.classroom?.number || 'неизвестный'} занят занятием ${l.subject?.name || ''} (${l.startTime}-${l.endTime}) в расписании "${sch.name}"`);
                    }
                }
            } catch (e) {
                // Игнорируем ошибки загрузки отдельных расписаний
            }
        }
        return conflicts;
    } catch (e) {
        console.warn('Глобальная проверка коллизий не удалась:', e);
        return [];
    }
}
