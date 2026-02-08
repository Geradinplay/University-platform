import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js'; // Импортируем parseTimeToMinutes

export function allowDrop(ev) { ev.preventDefault(); }
export function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

export function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);
    const zone = ev.target.closest('.dropzone');

    if (!zone) return; // Если сброшено не на dropzone, ничего не делаем.

    // Сохраняем оригинального родителя элемента для логики удаления перерыва.
    // Это нужно сделать до того, как el будет перемещен, т.к. el.nextSibling ссылается на текущего родителя.
    const originalParent = el.parentNode; 

    // Логика удаления перерыва из предыдущего дня при перемещении занятия.
    // Срабатывает, если перетаскиваемый элемент - занятие, при этом он был в 'day' и авто-перерывы включены.
    if (el.classList.contains('lesson') && originalParent && originalParent.classList.contains('day') && document.getElementById('breakToggle').checked) {
        const nextSiblingInOldParent = el.nextSibling;
        // Проверяем, что следующий элемент в старом родителе был блоком перерыва и принадлежит этому же родителю.
        if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block') && nextSiblingInOldParent.parentNode === originalParent) {
            nextSiblingInOldParent.remove(); // Удаляем блок перерыва из старого дня.
        }
    }

    if (zone.id === 'buffer') {
        // Если элемент перемещается в буфер, просто добавляем его.
        // Связанный перерыв из дня (если был) уже удален логикой выше.
        zone.appendChild(el); 
    } else { // Сброшено в ячейку дня
        const day = zone.querySelector('.day');
        if (!day) return; // На всякий случай, если day div не найден.

        const timeStr = el.querySelector('.lesson-time').innerText;
        const allowCollision = document.getElementById('allowCollision').checked;

        if (!allowCollision && checkCollision(timeStr, day)) {
            alert("Ошибка! В это время уже есть другое занятие.");
            return;
        }

        const newLessonStartTime = parseTimeToMinutes(timeStr.split('-')[0]);
        let insertReferenceNode = null;

        // Находим правильную точку вставки для нового занятия по времени
        for (const child of Array.from(day.children)) {
            if (child.classList.contains('lesson')) {
                const existingLessonTime = parseTimeToMinutes(child.querySelector('.lesson-time').innerText.split('-')[0]);
                if (newLessonStartTime < existingLessonTime) {
                    insertReferenceNode = child;
                    break;
                }
            }
        }

        // Вставляем занятие в найденную позицию
        day.insertBefore(el, insertReferenceNode);

        // Обрабатываем добавление нового блока перерыва специально для этого сброшенного занятия,
        // если авто-перерывы включены.
        if (document.getElementById('breakToggle').checked) {
            // Проверяем, существует ли уже блок перерыва сразу после этого занятия.
            // Это предотвращает добавление дубликатов, если занятие уже имело перерыв после себя.
            if (el.nextSibling && el.nextSibling.classList.contains('break-block')) {
                // Перерыв уже есть, не добавляем новый.
            } else {
                const min = document.getElementById('breakDuration').value;
                const b = document.createElement('div');
                b.className = 'break-block';
                b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                day.insertBefore(b, el.nextSibling); // Вставляем новый перерыв после занятия.
            }
        }
    }
}
