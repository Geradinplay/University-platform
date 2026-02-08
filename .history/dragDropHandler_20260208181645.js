import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js';
import { updateLessonDay } from './api.js'; // Используем updateLessonDay из api.js

let draggedElement = null; // Элемент, который перетаскивается

export function allowDrop(ev) {
    ev.preventDefault();
    // ИЗМЕНЕНО: При перетаскивании над контейнером буфера тоже подсвечиваем его
    if (ev.target.classList.contains('dropzone') || ev.target.closest('.day') || ev.target.closest('#buffer-content')) {
        ev.currentTarget.style.backgroundColor = '#eef4f8'; 
    }
}

document.addEventListener('dragend', (ev) => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    document.querySelectorAll('.dropzone, .day, #buffer-content').forEach(el => { // ИЗМЕНЕНО: Добавил #buffer-content
        el.style.backgroundColor = '';
    });
});


export function drag(ev) {
    draggedElement = ev.target;
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging');
}


export async function drop(ev) {
    ev.preventDefault();
    ev.currentTarget.style.backgroundColor = '';
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);

    if (!el || !el.classList.contains('lesson')) {
        console.warn("Dropped element is not a lesson or does not exist.");
        return;
    }

    const lessonId = el.id.replace('lesson-', '');
    const originalParent = el.parentNode;
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null;

    let newDay;
    // ИЗМЕНЕНО: Целевой контейнер для буфера - это теперь #buffer-content
    let targetContainer = ev.target.closest('.day') || ev.target.closest('#buffer-content'); 

    if (!targetContainer) {
        console.warn("No valid drop target found (day or buffer).");
        return;
    }

    // Удаление перерыва из предыдущего места (если был в дне)
    if (originalParent && originalParent.classList.contains('day')) {
        const nextSiblingInOldParent = el.nextSibling;
        if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block')) {
            nextSiblingInOldParent.remove();
        }
    }

    if (targetContainer.id === 'buffer-content') { // ИЗМЕНЕНО: ID буфера
        newDay = 0; // Для буфера
        targetContainer.appendChild(el); // Добавляем прямо в #buffer-content
    } else { // Сброшено в ячейку дня
        const timeStr = el.querySelector('.lesson-time').innerText;
        // Проверка наличия 'allowCollision' элемента, так как он находится в 'settings-content'
        const allowCollision = document.getElementById('allowCollision')?.checked || false; 
        
        if (!allowCollision && checkCollision(timeStr, targetContainer)) {
            alert("Ошибка! В это время уже есть другое занятие или перерыв.");
            return;
        }

        const newLessonStartTime = parseTimeToMinutes(timeStr.split('-')[0]);
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
        targetContainer.insertBefore(el, insertReferenceNode);

        // Определяем новый день (1-5) по data-day-index родителя
        newDay = parseInt(targetContainer.dataset.dayIndex);

        // Логика добавления перерыва после занятия
        const breakToggleEnabled = document.getElementById('breakToggle')?.checked;
        if (breakToggleEnabled) {
            if (!(el.nextSibling && el.nextSibling.classList.contains('break-block'))) {
                const min = document.getElementById('breakDuration')?.value || 10;
                const b = document.createElement('div');
                b.className = 'break-block';
                b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                targetContainer.insertBefore(b, el.nextSibling);
            }
        }
    }

    // ИЗМЕНЕНО: Обновляем data-day и отправляем запрос на сервер, если день изменился
    if (oldDay !== newDay) {
        el.dataset.day = newDay;
        // Собираем полный объект для PUT запроса
        const updatedLessonData = {
            startTime: el.dataset.startTime, // Берем из dataset
            endTime: el.dataset.endTime,     // Берем из dataset
            day: newDay,
            // Другие поля (subjectId, professorId, classroomId)
            // не меняются при перетаскивании, но PUT может требовать их.
            // Если сервер требует весь объект, их нужно будет получить.
            // Для вашей API-сводки, PUT требует только startTime, endTime, day.
        };
        try {
            await updateLessonDay(lessonId, updatedLessonData); // Отправляем полный объект
        } catch (error) {
            alert("Не удалось обновить день занятия на сервере: " + error.message);
            console.error("Failed to update lesson day on server:", error);
            // Здесь можно добавить логику отката в UI, если сервер вернул ошибку
        }
    }
}
