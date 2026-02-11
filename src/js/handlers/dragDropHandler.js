/**
 * ================================================
 * DRAG & DROP HANDLER - Обработчик перетаскивания
 * ================================================
 */

import { checkCollision } from '../utils/collisionDetector.js';
import { parseTimeToMinutes } from '../utils/utils.js';
import { updateLessonDay, createBreak, deleteBreak, updateBreak } from '../../../api/api.js';

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
    const target = ev.target.closest('.day') || ev.target.closest('#buffer-content') || (ev.currentTarget.classList.contains('dropzone') ? ev.currentTarget : null);
    if (target) {
        target.style.backgroundColor = '#eef4f8';
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

    let targetContainer = ev.target.closest('.day') || ev.target.closest('#buffer-content');
    if (!targetContainer && ev.currentTarget.classList.contains('dropzone')) {
        targetContainer = ev.currentTarget.querySelector('.day');
    }
    if (!targetContainer) return;

    const isToBuffer = targetContainer.id === 'buffer-content' || targetContainer.closest('#buffer-content');
    const newDay = isToBuffer ? 0 : parseInt(targetContainer.dataset.dayIndex);
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null;

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

            // Проверка стандартных коллизий времени
            if (!allowCollision && checkCollision(timeStr, targetContainer, el.id)) {
                alert("Ошибка! В это время уже есть другое заняти��.");
                return;
            }

            // ДОБАВЛЕНО: Проверка занятости кабинетов и профессоров
            const checkClassroomBusy = document.getElementById('checkClassroomBusy')?.checked;
            const checkProfessorBusy = document.getElementById('checkProfessorBusy')?.checked;

            if (checkClassroomBusy || checkProfessorBusy) {
                const [startTimeStr, endTimeStr] = timeStr.split('-');
                const startMin = parseTimeToMinutes(startTimeStr.trim());
                const endMin = parseTimeToMinutes(endTimeStr.trim());

                const lessonClassroomId = el.dataset.classroomId;
                const lessonProfessorId = el.dataset.professorId;

                // Получаем все занятия в целевом контейнере
                const dayLessons = targetContainer.querySelectorAll('.lesson');
                let hasConflict = false;

                dayLessons.forEach(otherLesson => {
                    if (otherLesson === el || hasConflict) return; // Пропускаем самого себя и если уже найден конфликт

                    const otherTimeStr = otherLesson.querySelector('.lesson-time').innerText;
                    const [otherStartStr, otherEndStr] = otherTimeStr.split('-');
                    const otherStartMin = parseTimeToMinutes(otherStartStr.trim());
                    const otherEndMin = parseTimeToMinutes(otherEndStr.trim());

                    // Проверяем пересечение времени
                    const hasTimeConflict = !(endMin <= otherStartMin || startMin >= otherEndMin);

                    if (hasTimeConflict) {
                        if (checkClassroomBusy && lessonClassroomId == otherLesson.dataset.classroomId) {
                            const classroomNumber = otherLesson.textContent.match(/\d+/)?.[0] || 'неизвестного';
                            alert(`❌ Кабинет ${classroomNumber} уже занят в это время (${otherTimeStr})`);
                            hasConflict = true;
                            return;
                        }

                        if (checkProfessorBusy && lessonProfessorId == otherLesson.dataset.professorId) {
                            const professorName = otherLesson.textContent.split(',')[0] || 'неизвестного преподавателя';
                            alert(`❌ Преподаватель ${professorName} уже занят в это время (${otherTimeStr})`);
                            hasConflict = true;
                            return;
                        }
                    }
                });

                if (hasConflict) return;
            }
        }

        // Перемещение в UI
        if (isToBuffer) {
            // Перемещаем только занятие в буфер
            // Перерыв остается на месте (независим от занятия!)
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

        // Синхронизация с сервером
        if (oldDay !== newDay) {
            el.dataset.day = newDay;
            await updateLessonOnServer(el, lessonId, newDay);
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