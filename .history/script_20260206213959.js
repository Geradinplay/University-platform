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
    const [newStart, newEnd] = newTimeStr.split('-').map(parseTimeToMinutes);
    const lessons = container.querySelectorAll('.lesson');

    for (let lesson of lessons) {
        const timeText = lesson.querySelector('.lesson-time').innerText;
        const [exStart, exEnd] = timeText.split('-').map(parseTimeToMinutes);

        // Условие пересечения интервалов
        if (newStart < exEnd && newEnd > exStart) return true;
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
function deleteItem() { if (targetToDelete) targetToDelete.remove(); }