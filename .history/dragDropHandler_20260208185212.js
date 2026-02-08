import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js';
import { updateLessonDay, createBreak, deleteBreak } from './api.js'; // ИЗМЕНЕНО: Добавлены createBreak, deleteBreak

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
    const originalParent = el.parentNode;
    const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null;

    let newDay;
    let targetContainer;

    if (ev.currentTarget.id === 'buffer-content') {
        targetContainer = ev.currentTarget;
    } else if (ev.currentTarget.classList.contains('dropzone') && ev.currentTarget.tagName === 'TD') {
        targetContainer = ev.currentTarget.querySelector('.day');
    } else if (ev.target.closest('.day')) {
        targetContainer = ev.target.closest('.day');
    } else if (ev.target.id === 'buffer-content') {
        targetContainer = ev.target;
    }
    
    if (!targetContainer) {
        console.warn("No valid drop target found. Drop event target:", ev.target, "Current target:", ev.currentTarget);
        return; 
    }

    // --- Удаление перерыва из предыдущего места (если был в дне) ---
    // Это происходит ДО перемещения элемента в DOM, поэтому el.nextSibling корректен
    if (originalParent && originalParent.classList.contains('day')) {
        const nextSiblingInOldParent = el.nextSibling;
        if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block')) {
            const breakIdToDelete = nextSiblingInOldParent.dataset.breakId;
            if (breakIdToDelete) {
                console.log("DragDrop: Attempting to delete break with ID:", breakIdToDelete); // ДОБАВЛЕНО
                try {
                    await deleteBreak(breakIdToDelete);
                    console.log(`Debug: Server break ${breakIdToDelete} deleted.`);
                } catch (error) {
                    console.error("Failed to delete break from server on lesson move:", error);
                }
            } else {
                console.warn("DragDrop: No breakId found for break-block in old parent."); // ДОБАВЛЕНО
            }
            nextSiblingInOldParent.remove();
            console.log(`Debug: Removed break-block after lesson-${lessonId} (oldDay: ${oldDay}) from DOM.`);
        } else {
            console.log(`Debug: No break-block found after lesson-${lessonId} (oldDay: ${oldDay}) for removal.`);
        }
    }
    // --- Конец удаления перерыва ---

    if (targetContainer.id === 'buffer-content') { 
        newDay = 0; // Для буфера
        targetContainer.appendChild(el); 
    } else { // Сброшено в ячейку дня
        const timeStr = el.querySelector('.lesson-time').innerText;
        const allowCollision = document.getElementById('settings-content')?.querySelector('#allowCollision')?.checked || false; 
        
        if (!allowCollision && checkCollision(timeStr, targetContainer, el.id)) {
            alert("Ошибка! В это время уже есть другое занятие или перерыв.");
            return;
        }

        const newLessonStartTime = parseTimeToMinutes(timeStr.split('-')[0]);
        let insertReferenceNode = null;

        for (const child of Array.from(targetContainer.children)) {
            if (child.dataset.startTime) { // Проверяем наличие dataset.startTime
                const existingItemTime = parseTimeToMinutes(child.dataset.startTime);
                if (newLessonStartTime < existingItemTime) {
                    insertReferenceNode = child;
                    break;
                }
            }
        }
        targetContainer.insertBefore(el, insertReferenceNode);

        newDay = parseInt(targetContainer.dataset.dayIndex);

        // Логика добавления перерыва после занятия
        const breakToggleEnabled = document.getElementById('settings-content')?.querySelector('#breakToggle')?.checked;
        if (breakToggleEnabled) {
            // Убеждаемся, что перерыва нет ИЛИ что текущий nextSibling не является перерывом, 
            // чтобы не добавлять дубликат, если занятие перемещается внутри дня.
            if (!(el.nextSibling && el.nextSibling.classList.contains('break-block') && el.nextSibling.dataset.breakId)) {
                const min = document.getElementById('settings-content')?.querySelector('#breakDuration')?.value || 10;
                
                // Рассчитываем время начала и конца перерыва
                const lessonEndTimeMinutes = parseTimeToMinutes(el.dataset.endTime);
                const breakStartTime = el.dataset.endTime;
                const breakEndTime = `${Math.floor((lessonEndTimeMinutes + parseInt(min)) / 60).toString().padStart(2, '0')}:${((lessonEndTimeMinutes + parseInt(min)) % 60).toString().padStart(2, '0')}`;

                try {
                    // ДОБАВЛЕНО: Создаем перерыв на сервере
                    const newBreakFromServer = await createBreak({
                        day: newDay,
                        startTime: breakStartTime,
                        endTime: breakEndTime,
                        duration: parseInt(min),
                        positionAfterLessonId: parseInt(lessonId) // Привязываем перерыв к ID занятия
                    });

                    const b = document.createElement('div');
                    b.className = 'break-block';
                    b.id = "break-" + newBreakFromServer.id; // Устанавливаем ID для DOM элемента
                    b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                    b.dataset.breakId = newBreakFromServer.id; // Сохраняем ID из сервера
                    b.dataset.day = newBreakFromServer.day;
                    b.dataset.startTime = newBreakFromServer.startTime;
                    b.dataset.endTime = newBreakFromServer.endTime;
                    b.dataset.duration = newBreakFromServer.duration;
                    targetContainer.insertBefore(b, el.nextSibling);
                    console.log(`Debug: Server break ${newBreakFromServer.id} created and added to DOM.`);

                } catch (error) {
                    console.error("Failed to create break on server:", error);
                    alert("Не удалось создать перерыв на сервере.");
                }
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
