import { isValidTimeRange, parseTimeToMinutes } from './utils.js';
import { createLesson } from './api.js'; // Импортируем функцию createLesson

export async function addNewLesson() { // Делаем функцию асинхронной
    const subjectSelect = document.getElementById('subjectSelect');
    const teacherSelect = document.getElementById('teacherSelect');
    const classroomSelect = document.getElementById('classroomSelect');
    
    // Получаем ID выбранных элементов
    const subjectId = subjectSelect.value;
    const professorId = teacherSelect.value;
    const classroomId = classroomSelect.value;

    // Получаем текстовые значения для отображения
    const selectedSubjectName = subjectSelect.options[subjectSelect.selectedIndex].textContent;
    const selectedTeacherName = teacherSelect.options[teacherSelect.selectedIndex].textContent;
    const selectedClassroomNumber = classroomSelect.options[classroomSelect.selectedIndex].textContent;
    
    const tm = document.getElementById('timeInput').value.trim();

    // Валидация входных данных
    if (subjectId === "") {
        alert("Пожалуйста, выберите предмет.");
        return;
    }
    if (professorId === "") {
        alert("Пожалуйста, выберите преподавателя.");
        return;
    }
    if (classroomId === "") {
        alert("Пожалуйста, выберите аудиторию.");
        return;
    }
    if (!isValidTimeRange(tm)) {
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
    d.innerHTML = `<div class="lesson-title">${selectedSubject}</div><div>${selectedTeacher}, ${selectedClassroom}</div><div class="lesson-time">${tm}</div>`;
    document.getElementById('buffer').appendChild(d);

    // Очистка полей формы после создания карточки
    subjectSelect.value = ''; // Сбрасываем выбор предмета
    teacherSelect.value = ''; // Сбрасываем выбор преподавателя
    classroomSelect.value = ''; // Сбрасываем выбор аудитории
    document.getElementById('timeInput').value = '';
}
