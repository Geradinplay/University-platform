import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js';
import { updateLessonDay, createBreak, deleteBreak, updateBreak } from './api.js'; // Добавлен updateBreak

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

    // --- Новый блок: поддержка перетаскивания break-block ---
    if (el && el.classList.contains('break-block')) {
        // Перетаскиваем break-block
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
            console.warn("No valid drop target found for break-block.");
            return;
        }

        // Проверка на коллизию с другими перерывами/занятиями
        const breakTimeStr = `${el.dataset.startTime}-${el.dataset.endTime}`;
        const allowCollision = document.getElementById('settings-content')?.querySelector('#allowCollision')?.checked || false;
        if (!allowCollision && checkCollision(breakTimeStr, targetContainer, el.id)) {
            alert("Ошибка! В это время уже есть другое занятие или перерыв.");
            return;
        }

        // Перемещаем break-block в новый контейнер
        targetContainer.insertBefore(el, null);

        // Обновляем день в dataset и на сервере
        const oldDay = el.dataset.day ? parseInt(el.dataset.day) : null;
        let newDay = 0;
        if (targetContainer.id === 'buffer-content') {
            newDay = 0;
        } else {
            newDay = parseInt(targetContainer.dataset.dayIndex);
        }
        if (oldDay !== newDay) {
            el.dataset.day = newDay;
            const breakId = el.dataset.breakId;
            if (breakId) {
                try {
                    await updateBreak(breakId, {
                        day: newDay,
                        startTime: el.dataset.startTime,
                        endTime: el.dataset.endTime,
                        duration: el.dataset.duration,
                        positionAfterLessonId: null // Можно добавить логику связывания с уроком
                    });
                } catch (error) {
                    alert("Не удалось обновить день перерыва на сервере: " + error.message);
                    console.error("Failed to update break day on server:", error);
                }
            }
        }
        return; // Завершаем обработку drop для break-block
    }
    // --- Конец блока break-block ---

    // ...existing code for lessons...
    // --- Удаление перерыва из предыдущего места (если был в дне) ---
    // Удаляем break-block только если он связан с lesson (positionAfterLessonId), иначе оставляем
    if (originalParent && originalParent.classList.contains('day')) {
        const nextSiblingInOldParent = el.nextSibling;
        if (
            nextSiblingInOldParent &&
            nextSiblingInOldParent.classList.contains('break-block') &&
            nextSiblingInOldParent.dataset.breakId &&
            nextSiblingInOldParent.dataset.day == oldDay &&
            nextSiblingInOldParent.dataset.startTime == el.dataset.endTime
        ) {
            // break-block связан с lesson, удаляем
            const breakIdToDelete = nextSiblingInOldParent.dataset.breakId;
            if (breakIdToDelete) {
                try {
                    await deleteBreak(breakIdToDelete);
                } catch (error) {
                    console.error("Failed to delete break from server on lesson move:", error);
                }
            }
            nextSiblingInOldParent.remove();
        }
    }
    // --- Конец удаления break-block ---

    // ...existing code for lesson drop...
}
