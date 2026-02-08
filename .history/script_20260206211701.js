// Разрешаем сброс в эту зону
function allowDrop(ev) {
    ev.preventDefault();
}

// Запоминаем, какой элемент тащим
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

// Логика "броска"
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    
    // Находим контейнер .day внутри ячейки, куда бросили
    const dropTarget = ev.target.closest('.dropzone').querySelector('.day');
    dropTarget.appendChild(draggedElement);
}

// Создание новой карточки
function addNewLesson() {
    const title = document.getElementById('titleInput').value;
    const info = document.getElementById('infoInput').value;
    const time = document.getElementById('timeInput').value;

    if (!title || !time) {
        alert("Введите название и время!");
        return;
    }

    const newId = "lesson-" + Date.now(); // Уникальный ID
    
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

    // По умолчанию добавляем в первый день (Понедельник)
    document.querySelector('.day').appendChild(lessonDiv);
    
    // Очистка полей
    document.getElementById('titleInput').value = '';
    document.getElementById('infoInput').value = '';
    document.getElementById('timeInput').value = '';
}