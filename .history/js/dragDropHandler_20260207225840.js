import { checkCollision } from './collisionDetector.js';
import { parseTimeToMinutes } from './utils.js'; // Импортируем parseTimeToMinutes

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

            // Добавляем элемент временно, чтобы он был в списке для сортировки
            day.appendChild(el);

            // Получаем все элементы занятий в текущем дне
            const lessonsInDay = Array.from(day.querySelectorAll('.lesson'));

            // Сортируем занятия по времени начала
            lessonsInDay.sort((a, b) => {
                const timeA = a.querySelector('.lesson-time').innerText.split('-')[0];
                const timeB = b.querySelector('.lesson-time').innerText.split('-')[0];
                return parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB);
            });

            // Очищаем контейнер дня
            while (day.firstChild) {
                day.removeChild(day.firstChild);
            }

            // Вставляем отсортированные занятия и (по желанию) блоки перерывов
            const breakToggleEnabled = document.getElementById('breakToggle').checked;
            const breakDuration = document.getElementById('breakDuration').value;

            lessonsInDay.forEach((lesson, index) => {
                day.appendChild(lesson);

                // Если включены авто-перерывы, добавляем перерыв после каждого занятия
                // кроме последнего, если это не буфер
                if (breakToggleEnabled && index < lessonsInDay.length) { // Добавляем перерыв после каждого занятия, если опция включена
                    const b = document.createElement('div');
                    b.className = 'break-block';
                    b.innerText = `ПЕРЕРЫВ: ${breakDuration} МИН.`;
                    day.appendChild(b);
                }
            });
        }
    }
}
