import { parseTimeToMinutes } from './utils.js';

function parseBreakDuration(breakText) {
    const match = breakText.match(/(\d+)\s*МИН/);
    return match ? parseInt(match[1]) : 0;
}

export function checkCollision(newTimeStr, container) {
    const [newStartMin, newEndMin] = newTimeStr.split('-').map(parseTimeToMinutes);
    const dayElements = container.children;

    let currentLogicalTime = 0;

    // Поскольку `breakToggle` был удален, пока нет логики для него.
    // Предполагаем, что перерывы все еще могут быть, но их учет в коллизиях зависит от UI.
    // Если `breakToggle` будет возвращен, нужно будет добавить его проверку.

    for (let i = 0; i < dayElements.length; i++) {
        const element = dayElements[i];

        if (element.classList.contains('lesson')) {
            const timeText = element.querySelector('.lesson-time').innerText;
            const [exStart, exEnd] = timeText.split('-').map(parseTimeToMinutes);

            if (newStartMin < exEnd && newEndMin > exStart) {
                return true;
            }
            currentLogicalTime = exEnd;
        } else if (element.classList.contains('break-block')) {
            // Учитываем блоки перерыва для коллизий
            // Если функционал автоматических перерывов вернется, этот блок нужно будет адаптировать
            const breakDuration = parseBreakDuration(element.innerText);
            const breakStart = currentLogicalTime;
            const breakEnd = currentLogicalTime + breakDuration;

            if (newStartMin < breakEnd && newEndMin > breakStart) {
                return true;
            }
            currentLogicalTime = breakEnd;
        }
    }
    return false;
}
