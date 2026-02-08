let targetToDelete = null;

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// Конвертация "15:30" -> 930 минут
function parseTimeToMinutes(t) {
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + m;
}

// Проверка на пересечение
function checkCollision(newTimeStr, container) {
    const [newStartMin, newEndMin] = newTimeStr.split('-').map(parseTimeToMinutes);
    const dayElements = container.children; // Получаем все дочерние элементы контейнера дня

    let currentLogicalTime = 0; // Отслеживаем текущее время на "таймлайне" в минутах от полуночи

    // Вспомогательная функция для извлечения длительности перерыва из текста
    function parseBreakDuration(breakText) {
        const match = breakText.match(/(\d+)\s*МИН/);
        return match ? parseInt(match[1]) : 0;
    }

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
            // Учитываем блоки перерывов для коллизий только если опция перерывов включена
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
 
// Проверка формата времени ЧЧ:ММ-ЧЧ:ММ
function isValidTimeRange(timeStr) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeStr);
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const el = document.getElementById(data);
    const zone = ev.target.closest('.dropzone');

    if (zone) {
        if (zone.id === 'buffer') {
            zone.appendChild(el);
        } else {
            const day = zone.querySelector('.day');
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

function addNewLesson() {
    const t = document.getElementById('titleInput').value || "Тест";
    const i = document.getElementById('infoInput').value || "Инфо";
    const tm = document.getElementById('timeInput').value.trim(); // Получаем значение и удаляем пробелы

    // Добавляем валидацию времени перед созданием карточки
    if (!isValidTimeRange(tm)) {
        alert("Пожалуйста, введите время в корректном формате ЧЧ:ММ-ЧЧ:ММ (например, 09:00-10:00).");
        return; // Прекращаем выполнение, если формат некорректен
    }

    // Добавляем проверку, что время начала раньше времени окончания
    const [startTimeStr, endTimeStr] = tm.split('-');
    const startMinutes = parseTimeToMinutes(startTimeStr);
    const endMinutes = parseTimeToMinutes(endTimeStr);

    if (startMinutes >= endMinutes) {
        alert("Время окончания занятия должно быть позже времени начала.");
        return;
    }

    const id = "ID" + Date.now();
    const d = document.createElement('div');
    d.className = 'lesson'; d.id = id; d.draggable = true;
    d.ondragstart = drag;
    d.innerHTML = `<div class="lesson-title">${t}</div><div>${i}</div><div class="lesson-time">${tm}</div>`;
    document.getElementById('buffer').appendChild(d);
}

// Контекстное меню
window.oncontextmenu = (e) => {
    const item = e.target.closest('.lesson') || e.target.closest('.break-block');
    if (item) {
        e.preventDefault();
        targetToDelete = item;
        const m = document.getElementById('context-menu');
        m.style.display = 'block'; m.style.left = e.pageX + 'px'; m.style.top = e.pageY + 'px';
    }
};
window.onclick = () => { document.getElementById('context-menu').style.display = 'none'; };
function deleteItem() {
    if (targetToDelete) {
        // Если удаляемый элемент - это занятие и включены авто-перерывы
        if (targetToDelete.classList.contains('lesson') && document.getElementById('breakToggle').checked) {
            const nextSibling = targetToDelete.nextSibling;
            // Проверяем, является ли следующий элемент блоком перерыва
            if (nextSibling && nextSibling.classList.contains('break-block')) {
                nextSibling.remove(); // Удаляем блок перерыва
            }
        }
        targetToDelete.remove(); // Удаляем сам элемент (занятие или перерыв)
    }
}