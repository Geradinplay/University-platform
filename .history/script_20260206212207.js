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
    
    const targetZone = ev.target.closest('.dropzone');
    
    if (targetZone) {
        if (targetZone.id === 'buffer') {
            targetZone.appendChild(draggedElement);
        } else {
            const dayContainer = targetZone.querySelector('.day');
            dayContainer.appendChild(draggedElement);
        }
    }
}

function addNewLesson() {
    const title = document.getElementById('titleInput').value;
    const info = document.getElementById('infoInput').value;
    const time = document.getElementById('timeInput').value;

    if (!title || !time) {
        alert("Заполните хотя бы название и время!");
        return;
    }

    const newId = "lesson-" + Date.now();
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
    
    // Очистка полей
    document.getElementById('titleInput').value = '';
    document.getElementById('infoInput').value = '';
    document.getElementById('timeInput').value = '';
}