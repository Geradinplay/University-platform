let currentElementForDelete = null;

// Переключение вкладок
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Контекстное меню
window.addEventListener('contextmenu', function(ev) {
    const lesson = ev.target.closest('.lesson, .break-card');
    if (lesson) {
        ev.preventDefault();
        currentElementForDelete = lesson;
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = ev.pageX + 'px';
        menu.style.top = ev.pageY + 'px';
    } else {
        document.getElementById('context-menu').style.display = 'none';
    }
});

window.addEventListener('click', () => {
    document.getElementById('context-menu').style.display = 'none';
});

function deleteElement() {
    if (currentElementForDelete) currentElementForDelete.remove();
}

// Drag and Drop
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const targetZone = ev.target.closest('.dropzone');
    
    if (targetZone) {
        const container = targetZone.id === 'buffer' ? targetZone : targetZone.querySelector('.day');
        container.appendChild(draggedElement);

        // Если бросили в таблицу и включены перерывы
        if (targetZone.id !== 'buffer' && document.getElementById('breakToggle').checked) {
            addAutoBreak(container);
        }
    }
}

function addAutoBreak(container) {
    const duration = document.getElementById('breakDuration').value;
    const breakDiv = document.createElement('div');
    breakDiv.className = 'break-card';
    breakDiv.innerHTML = `Перерыв: ${duration} мин.`;
    container.appendChild(breakDiv);
}

function addNewLesson() {
    const title = document.getElementById('titleInput').value || 'Занятие';
    const info = document.getElementById('infoInput').value || '';
    const time = document.getElementById('timeInput').value || '00:00';

    const newId = "id-" + Date.now();
    const lessonDiv = document.createElement('div');
    lessonDiv.className = 'lesson';
    lessonDiv.draggable = true;
    lessonDiv.id = newId;
    lessonDiv.ondragstart = drag;

    lessonDiv.innerHTML = `
        <div class="lesson-title">${title}</div>
        <div class="lesson-info">${info}</div>
        <div class="lesson-time">${time}</div>
    `;

    document.getElementById('buffer').appendChild(lessonDiv);
}