let targetToDelete = null;

// Переключение вкладок
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Drag & Drop
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const element = document.getElementById(data);
    const dropZone = ev.target.closest('.dropzone');

    if (dropZone) {
        if (dropZone.id === 'buffer') {
            dropZone.appendChild(element);
        } else {
            const dayDiv = dropZone.querySelector('.day');
            dayDiv.appendChild(element);

            // АВТОПЕРЕРЫВ
            if (document.getElementById('breakToggle').checked) {
                const breakTime = document.getElementById('breakTime').value;
                const breakEl = document.createElement('div');
                breakEl.className = 'break-block';
                breakEl.innerHTML = `ПЕРЕРЫВ: ${breakTime}`;
                dayDiv.appendChild(breakEl);
            }
        }
    }
}

// Создание карточки
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
}

// КАСТОМНОЕ МЕНЮ
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
    if (targetToDelete) targetToDelete.remove();
}