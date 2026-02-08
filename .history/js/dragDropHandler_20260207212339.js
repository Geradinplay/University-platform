import { checkCollision } from './collisionDetector.js';

export function allowDrop(ev) { ev.preventDefault(); }
export function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

export function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);
    const zone = ev.target.closest('.dropzone');

    if (zone) {
        if (zone.id === 'buffer') {
            // Если элемент перемещается обратно в буфер
            // Проверяем, является ли удаляемый элемент занятием и включены ли авто-перерывы
            if (el.classList.contains('lesson') && document.getElementById('breakToggle').checked) {
                const prevParent = el.parentNode; // Предыдущий родительский элемент (day div)
                const nextSibling = el.nextSibling;
                // Проверяем, был ли следующий элемент блоком перерыва и находится ли он в том же родительском контейнере
                if (nextSibling && nextSibling.classList.contains('break-block') && nextSibling.parentNode === prevParent) {
                    nextSibling.remove(); // Удаляем блок перерыва
                }
            }
            zone.appendChild(el); // Перемещаем занятие в буфер
        } else {
            const day = zone.querySelector('.day');
            
            // Удаление перерыва из предыдущего дня при перемещении
            // Проверяем, откуда был перемещен элемент и есть ли там связанный перерыв
            if (el.classList.contains('lesson') && document.getElementById('breakToggle').checked) {
                const previousParent = el.parentNode; // Получаем текущего родителя (старый день)
                const nextSiblingInOldParent = el.nextSibling;
                // Если следующий элемент в старом родителе был перерывом, удаляем его
                if (nextSiblingInOldParent && nextSiblingInOldParent.classList.contains('break-block') && nextSiblingInOldParent.parentNode === previousParent) {
                    nextSiblingInOldParent.remove();
                }
            }

            const timeStr = el.querySelector('.lesson-time').innerText;
            const allowCollision = document.getElementById('allowCollision').checked;

            if (!allowCollision && checkCollision(timeStr, day)) {
                alert("Ошибка! В это время уже есть другое занятие.");
                return;
            }

            day.appendChild(el);

            if (document.getElementById('breakToggle').checked) {
                const min = document.getElementById('breakDuration').value;
                const b = document.createElement('div');
                b.className = 'break-block';
                b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
                day.appendChild(b);
            }
        }
    }
}
