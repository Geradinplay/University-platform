import { parseTimeToMinutes } from './utils.js';

// Вспомогательная функция для извлечения длительности перерыва из текста
function parseBreakDuration(breakText) {
    const match = breakText.match(/(\d+)\s*МИН/);
    return match ? parseInt(match[1]) : 0;
}

export function checkCollision(newTimeStr, container) {
    const [newStartMin, newEndMin] = newTimeStr.split('-').map(parseTimeToMinutes);
    const dayElements = container.children; // Получаем все дочерние элементы контейнера дня

    let currentLogicalTime = 0; // Отслеживаем текущее время на "таймлайне" в минутах от полуночи

    const breakToggleEnabled = document.getElementById('breakToggle').checked;
    for (let i = 0; i < dayElements.length; i++) {
        const element = dayElements[i];

        if (element.classList.contains('lesson')) {
            const timeText = element.querySelector('.lesson-time').innerText;
            const [exStart, exEnd] = timeText.split('-').map(parseTimeToMinutes);

            // Проверяем коллизию с существующим занятием
            if (newStartMin < exEnd && newEndMin > exStart) {
                return true;
            }
            currentLogicalTime = exEnd; // Обновляем текущее логическое время до конца занятия
        } else if (element.classList.contains('break-block')) {
            // Учитываем блоки перерыва для коллизий только если опция перерывов включена
            if (breakToggleEnabled) {
                const breakDuration = parseBreakDuration(element.innerText);
                const breakStart = currentLogicalTime;
                const breakEnd = currentLogicalTime + breakDuration;

                // Проверяем коллизию с существующим перерывом
                if (newStartMin < breakEnd && newEndMin > breakStart) {
                    return true;
                }
                currentLogicalTime = breakEnd; // Обновляем текущее логическое время до конца перерыва
            }
            // Если breakToggleEnabled выключен, блок перерыва игнорируется
            // и currentLogicalTime не изменяется, так как он не "занимает" время для коллизий.
        }
    }
    return false;
}
