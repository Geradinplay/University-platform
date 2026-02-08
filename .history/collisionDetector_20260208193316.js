import { parseTimeToMinutes } from './utils.js';

function parseBreakDuration(breakText) {
    const match = breakText.match(/(\d+)\s*МИН/);
    return match ? parseInt(match[1]) : 0;
}

// ДОБАВЛЕНО: draggedElementId для игнорирования элемента при проверке коллизий
export function checkCollision(newTimeStr, container, draggedElementId = null) {
    const [newStartMin, newEndMin] = newTimeStr.split('-').map(parseTimeToMinutes);
    const dayElements = container.children;

    const settingsContent = document.getElementById('settings-content');
    const breakToggleEnabled = settingsContent?.querySelector('#breakToggle')?.checked || false;
    const allowCollision = settingsContent?.querySelector('#allowCollision')?.checked || false;

    if (allowCollision) {
        return false; // Если разрешены коллизии, всегда возвращаем false
    }

    for (let i = 0; i < dayElements.length; i++) {
        const element = dayElements[i];

        // Игнорируем сам перетаскиваемый элемент при проверке коллизий
        if (draggedElementId && element.id === draggedElementId) {
            continue;
        }

        const elementStartTimeText = element.dataset.startTime;
        const elementEndTimeText = element.dataset.endTime;

        if (!elementStartTimeText || !elementEndTimeText) {
            // Пропускаем элементы без корректного времени, которые не участвуют в коллизиях
            continue; 
        }

        const [exStart, exEnd] = [parseTimeToMinutes(elementStartTimeText), parseTimeToMinutes(elementEndTimeText)];

        // Проверяем коллизию с существующим элементом
        if (newStartMin < exEnd && newEndMin > exStart) {
            // break-block всегда участвует в коллизиях при переносе break-block
            return true;
        }
    }
    return false;
}
