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
    // ИЗМЕНЕНО: Добавил #buffer-content для очистки фона
    document.querySelectorAll('.dropzone, .day, #buffer-content').forEach(el => { 
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
    const originalParent = el.parentNode; // Родитель ДО обработки события drop
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null;

    let newDay;
    let targetContainer;

    // Надежно определяем целевой контейнер для операции drop
    if (ev.currentTarget.id === 'buffer-content') {
        targetContainer = ev.currentTarget; // Сброшено непосредственно в буфер (сам элемент буфера)
    } else if (ev.currentTarget.classList.contains('dropzone') && ev.currentTarget.tagName === 'TD') {
        targetContainer = ev.currentTarget.querySelector('.day'); // Сброшено в ячейку дня (TD), находим внутренний div.day
    } else if (ev.target.closest('.day')) { // Сброшено на дочерний элемент внутри div.day (например, на другое занятие)
        targetContainer = ev.target.closest('.day');
    } else if (ev.target.id === 'buffer-content') { // Сброшено в буфер (если ev.target - это сам элемент буфера)
        targetContainer = ev.target;
    }
    
    if (!targetContainer) {
        console.warn("No valid drop target found. Drop event target:", ev.target, "Current target:", ev.currentTarget);
        return; 
    }

    // --- Критично: Удаляем любой блок перерыва, связанный с перетаскиваемым занятием, из его ИСХОДНОГО родителя.
    // Это должно произойти ДО проверки коллизий и ДО перемещения занятия из originalParent,
    // чтобы el.nextSibling ссылался на правильный элемент в исходном DOM.
    // Это гарантирует, что исходный слот действительно "очищен" для последующих проверок коллизий в целевом контейнере.
    if (originalParent && originalParent.classList.contains('day')) {
        const nextSiblingInOldParent = el.nextSibling;
        if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block')) {
            nextSiblingInOldParent.remove();
            console.log(`Debug: Removed break-block after lesson-${lessonId} (oldDay: ${oldDay})`);
        } else {
            console.log(`Debug: No break-block found after lesson-${lessonId} (oldDay: ${oldDay}) for removal.`);
        }
    }
    // --- Конец критического удаления перерыва ---

    if (targetContainer.id === 'buffer-content') { 
        newDay = 0; // Для буфера
        targetContainer.appendChild(el); 
    } else { // Сброшено в ячейку дня
        const timeStr = el.querySelector('.lesson-time').innerText;
        // Проверка наличия 'allowCollision' элемента, так как он находится в 'settings-content'
        const allowCollision = document.getElementById('settings-content')?.querySelector('#allowCollision')?.checked || false; 
        
        // --- Проверка коллизий ---
        // Передаем el.id в checkCollision, чтобы он игнорировал перетаскиваемый элемент
        // (актуально для перемещений внутри одного контейнера).
        if (!allowCollision && checkCollision(timeStr, targetContainer, el.id)) {
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
        const breakToggleEnabled = document.getElementById('settings-content')?.querySelector('#breakToggle')?.checked;
        if (breakToggleEnabled) {
            if (!(el.nextSibling && el.nextSibling.classList.contains('break-block'))) {
                const min = document.getElementById('settings-content')?.querySelector('#breakDuration')?.value || 10;
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
        const updatedLessonData = {
            startTime: el.dataset.startTime, 
            endTime: el.dataset.endTime,    
            day: newDay,
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
