import { parseTimeToMinutes } from './utils.js';

function parseBreakDuration(breakText) {
    const match = breakText.match(/(\d+)\s*МИН/);
    return match ? parseInt(match[1]) : 0;
}

// ДОБАВЛЕНО: draggedElementId для игнорирования элемента при проверке коллизий
export function checkCollision(newTimeStr, container, draggedElementId = null) {
    const [newStartMin, newEndMin] = newTimeStr.split('-').map(parseTimeToMinutes);
    const dayElements = container.children;

    let currentLogicalTime = 0;

    // Проверка состояния чекбоксов "Автоматические перерывы" и "Разрешить пересечения во времени"
    // ИЗМЕНЕНО: Эти элементы теперь находятся во вкладке #settings-content
    const settingsContent = document.getElementById('settings-content');
    const breakToggleEnabled = settingsContent?.querySelector('#breakToggle')?.checked || false;
    const allowCollision = settingsContent?.querySelector('#allowCollision')?.checked || false;

    if (allowCollision) {
        return false; // Если разрешены коллизии, всегда возвращаем false
    }

    for (let i = 0; i < dayElements.length; i++) {
        const element = dayElements[i];

        // ДОБАВЛЕНО: Игнорируем сам перетаскиваемый элемент при проверке коллизий
        if (draggedElementId && element.id === draggedElementId) {
            continue;
        }

        if (element.classList.contains('lesson')) {
            const timeText = element.querySelector('.lesson-time')?.innerText;
            if (!timeText) continue; // Пропускаем, если нет текста времени
            const [exStart, exEnd] = timeText.split('-').map(parseTimeToMinutes);

            // Проверяем коллизию с существующим занятием
            if (newStartMin < exEnd && newEndMin > exStart) {
                return true;
            }
            currentLogicalTime = exEnd;
        } else if (element.classList.contains('break-block')) {
            // Учитываем блоки перерыва для коллизий, только если опция перерывов включена
            if (breakToggleEnabled) {
                const breakDuration = parseBreakDuration(element.innerText);
                const breakStart = currentLogicalTime;
                const breakEnd = currentLogicalTime + breakDuration;

                // Проверяем коллизию с существующим перерывом
                if (newStartMin < breakEnd && newEndMin > breakStart) {
                    return true;
                }
                currentLogicalTime = breakEnd;
            }
            // Если breakToggleEnabled выключен, блок перерыва игнорируется
            // и currentLogicalTime не изменяется, так как он не "занимает" время для коллизий.
        }
    }
    return false;
}
