import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js';
import { updateLessonDay, deleteLesson } from './mockApi.js'; // ИЗМЕНЕНО: теперь используем mockApi.js

let draggedElement = null; // Элемент, который перетаскивается

export function allowDrop(ev) {
    ev.preventDefault();
    // Визуальный эффект при перетаскивании над зоной
    if (ev.target.classList.contains('dropzone') || ev.target.closest('.day')) {
        ev.currentTarget.style.backgroundColor = '#eef4f8'; // Мягкий фон
    }
}

export function drag(ev) {
    draggedElement = ev.target;
    ev.dataTransfer.setData("text", ev.target.id);
    ev.target.classList.add('dragging'); // Добавляем класс для стилизации
}

// Добавлено: обработчик окончания перетаскивания для очистки стилей
document.addEventListener('dragend', (ev) => {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    // Очистка эффекта сброса
    document.querySelectorAll('.dropzone, .day').forEach(el => {
        el.style.backgroundColor = ''; // Сбросить фон
    });
});


export async function drop(ev) { // Делаем функцию асинхронной
    ev.preventDefault();
    ev.currentTarget.style.backgroundColor = ''; // Сбросить фон на цели
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);

    if (!el || !el.classList.contains('lesson')) {
        console.warn("Dropped element is not a lesson or does not exist.");
        return;
    }

    const lessonId = el.id.replace('lesson-', ''); // Извлекаем ID занятия
    const originalParent = el.parentNode;
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null; // Предыдущий день

    let newDay;
    let targetContainer = ev.target.closest('.day') || ev.target.closest('#buffer-container'); // ИЗМЕНЕНО: ID буфера

    if (!targetContainer) {
        console.warn("No valid drop target found (day or buffer).");
        return;
    }

    // Удаление перерыва из предыдущего места
    if (originalParent && originalParent.classList.contains('day')) {
        const nextSiblingInOldParent = el.nextSibling;
        if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block')) {
            nextSiblingInOldParent.remove();
        }
    }

    if (targetContainer.id === 'buffer-container') { // ИЗМЕНЕНО: ID буфера
        newDay = 0; // Для буфера
        targetContainer.appendChild(el);
    } else { // Сброшено в ячейку дня
        const timeStr = el.querySelector('.lesson-time').innerText;
        const allowCollision = document.getElementById('allowCollision')?.checked || false; // optional chaining
        
        // ВНИМАНИЕ: Если checkCollision также использует mockApi, нужно убедиться, что он работает с текущим состоянием DOM или моковыми данными.
        if (!allowCollision && checkCollision(timeStr, targetContainer)) {
            alert("Ошибка! В это время уже есть другое занятие или перерыв.");
            return; // Отменяем перемещение
        }

        const newLessonStartTime = parseTimeToMinutes(timeStr.split('-')[0]);
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
        targetContainer.insertBefore(el, insertReferenceNode);

        // Определяем новый день (1-5) по data-day-index родителя
        newDay = parseInt(targetContainer.dataset.dayIndex);

        // Логика добавления перерыва после занятия
        if (document.getElementById('breakToggle')?.checked) { // optional chaining
            if (!(el.nextSibling && el.nextSibling.classList.contains('break-block'))) {
                const min = document.getElementById('breakDuration')?.value || 10; // optional chaining
                const b = document.createElement('div');
                b.className = 'break-block';
                b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                targetContainer.insertBefore(b, el.nextSibling);
            }
        }
    }

    // Обновляем data-day и отправляем запрос на сервер, если день изменился
    if (oldDay !== newDay) {
        el.dataset.day = newDay;
        try {
            await updateLessonDay(lessonId, newDay);
        } catch (error) {
            alert("Не удалось обновить день занятия на сервере (mock): " + error.message);
            console.error("Failed to update lesson day on mock server:", error);
            // Можно добавить логику отката UI здесь
        }
    }
}
