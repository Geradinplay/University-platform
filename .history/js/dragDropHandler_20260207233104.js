import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js';
import { updateLessonDay } from './api.js'; // Импортируем updateLessonDay

export function allowDrop(ev) { ev.preventDefault(); }
export function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

export async function drop(ev) { // Делаем функцию асинхронной
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);
    const zone = ev.target.closest('.dropzone');

    if (!zone || !el || !el.classList.contains('lesson')) return; // Убедимся, что это занятие

    const lessonId = el.id.replace('lesson-', ''); // Извлекаем ID занятия
    const originalParent = el.parentNode; 
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null; // Предыдущий день

    // --- Логика удаления перерыва из предыдущего дня ---
    // Срабатывает, если перетаскиваемый элемент - занятие, был в 'day' и авто-перерывы включены.
    if (el.classList.contains('lesson') && originalParent && originalParent.classList.contains('day') && document.getElementById('breakToggle').checked) {
        const nextSiblingInOldParent = el.nextSibling;
        if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block') && nextSiblingInOldParent.parentNode === originalParent) {
            nextSiblingInOldParent.remove();
        }
    }
    // --- Конец логики удаления перерыва ---

    let newDay;
    if (zone.id === 'buffer') {
        newDay = 0; // Для буфера
        zone.appendChild(el); 
    } else { // Сброшено в ячейку дня
        const day = zone.querySelector('.day');
        if (!day) return; 

        // Определяем новый день (1-5)
        const dayCells = Array.from(document.querySelectorAll('.table-container tbody td'));
        const newDayIndex = dayCells.indexOf(zone); // Индекс td (0-4)
        newDay = newDayIndex + 1; // Преобразуем в 1-5

        const timeStr = el.querySelector('.lesson-time').innerText;
        const allowCollision = document.getElementById('allowCollision').checked;

        if (!allowCollision && checkCollision(timeStr, day)) {
            alert("Ошибка! В это время уже есть другое занятие.");
            // Если коллизия, не перемещаем элемент и не обновляем на сервере
            return;
        }

        const newLessonStartTime = parseTimeToMinutes(timeStr.split('-')[0]);
        let insertReferenceNode = null;

        for (const child of Array.from(day.children)) {
            if (child.classList.contains('lesson')) {
                const existingLessonTime = parseTimeToMinutes(child.querySelector('.lesson-time').innerText.split('-')[0]);
                if (newLessonStartTime < existingLessonTime) {
                    insertReferenceNode = child;
                    break;
                }
            }
        }
        day.insertBefore(el, insertReferenceNode);

        if (document.getElementById('breakToggle').checked) {
            if (!(el.nextSibling && el.nextSibling.classList.contains('break-block'))) {
                const min = document.getElementById('breakDuration').value;
                const b = document.createElement('div');
                b.className = 'break-block';
                b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                day.insertBefore(b, el.nextSibling);
            }
        }
    }

    // Если день изменился, обновляем data-day и отправляем запрос на сервер
    if (oldDay !== newDay) {
        el.dataset.day = newDay;
        try {
            await updateLessonDay(lessonId, newDay);
        } catch (error) {
            alert("Не удалось обновить день занятия на сервере: " + error.message);
            console.error("Failed to update lesson day on server:", error);
            // Возможно, здесь стоит откатить изменения в UI, если сервер не обновился
        }
    }
}
