import { isValidTimeRange, parseTimeToMinutes } from './utils.js';

export function addNewLesson() {
    const t = document.getElementById('titleInput').value;
    const teacherSelect = document.getElementById('teacherSelect');
    const classroomSelect = document.getElementById('classroomSelect');
    const selectedTeacher = teacherSelect.options[teacherSelect.selectedIndex].textContent;
    const selectedClassroom = classroomSelect.options[classroomSelect.selectedIndex].textContent;
    
    const tm = document.getElementById('timeInput').value.trim(); // Получаем значение и удаляем пробелы

    // Валидация входных данных
    if (!t) {
        alert("Пожалуйста, введите название занятия.");
        return;
    }
    if (teacherSelect.value === "") {
        alert("Пожалуйста, выберите преподавателя.");
        return;
    }
    if (classroomSelect.value === "") {
        alert("Пожалуйста, выберите аудиторию.");
        return;
    }
    if (!isValidTimeRange(tm)) {
        alert("Пожалуйста, введите время в корректном формате ЧЧ:ММ-ЧЧ:ММ (например, 09:00-10:00).");
        return;
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
    d.ondragstart = window.drag; // Используем глобальную функцию drag
    // Объединяем выбранные значения для отображения
    d.innerHTML = `<div class="lesson-title">${t}</div><div>${selectedTeacher}, ${selectedClassroom}</div><div class="lesson-time">${tm}</div>`;
    document.getElementById('buffer').appendChild(d);

    // Очистка полей формы после создания карточки
    document.getElementById('titleInput').value = '';
    teacherSelect.value = ''; // Сбрасываем выбор преподавателя
    classroomSelect.value = ''; // Сбрасываем выбор аудитории
    document.getElementById('timeInput').value = '';
}
