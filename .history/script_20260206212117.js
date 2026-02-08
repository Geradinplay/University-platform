function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    
    // Находим ближайшую зону сброса (буфер или ячейка таблицы)
    let target = ev.target.closest('.dropzone');
    
    if (target) {
        if (target.id === 'buffer') {
            target.appendChild(draggedElement);
        } else {
            // Если таблица, кладем внутрь .day
            const dayContainer = target.querySelector('.day');
            dayContainer.appendChild(draggedElement);
        }
    }
}

function addNewLesson() {
    const title = document.getElementById('titleInput').value || 'Без названия';
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