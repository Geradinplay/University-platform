let targetToDelete = null;

// 1. Переключение вкладок
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// 2. Drag and Drop
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const targetZone = ev.target.closest('.dropzone');
    
    if (targetZone) {
        if (targetZone.id === 'buffer') {
            targetZone.appendChild(draggedElement);
        } else {
            const dayContainer = targetZone.querySelector('.day');
            dayContainer.appendChild(draggedElement);

            // ЛОГИКА АВТОПЕРЕРЫВА
            if (document.getElementById('breakToggle').checked) {
                const minutes = document.getElementById('breakDuration').value || "15";
                const breakId = "break-" + Date.now();
                
                const breakEl = document.createElement('div');
                breakEl.className = 'break-block';
                breakEl.id = breakId;
                breakEl.innerHTML = `ПЕРЕРЫВ: ${minutes} МИН.`;
                
                dayContainer.appendChild(breakEl);
            }
        }
    }
}

// 3. Создание новой карточки
function addNewLesson() {
    const title = document.getElementById('titleInput').value || "Без названия";
    const info = document.getElementById('infoInput').value || "—";
    const time = document.getElementById('timeInput').value || "00:00 - 00:00";

    const id = "L" + Date.now();
    const div = document.createElement('div');
    div.className = 'lesson';
    div.id = id;
    div.draggable = true;
    div.ondragstart = drag;

    div.innerHTML = `
        <div class="lesson-title">${title}</div>
        <div class="lesson-info">${info}</div>
        <div class="lesson-time">${time}</div>
    `;

    document.getElementById('buffer').appendChild(div);

    // Очистка
    document.getElementById('titleInput').value = '';
    document.getElementById('infoInput').value = '';
    document.getElementById('timeInput').value = '';
}

// 4. Кастомное контекстное меню
window.addEventListener('contextmenu', (e) => {
    const item = e.target.closest('.lesson') || e.target.closest('.break-block');
    if (item) {
        e.preventDefault();
        targetToDelete = item;
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
    }
});

window.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

function deleteItem() {
    if (targetToDelete) {
        targetToDelete.remove();
        targetToDelete = null;
    }
}