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
        alert("Пожалуйста, введите время в корректном формате ЧЧ:ММ-ЧЧ:ММ (например, 09:00-10:00).");
        return;
    }

    const [startTimeStr, endTimeStr] = tm.split('-');
    const startMinutes = parseTimeToMinutes(startTimeStr);
    const endMinutes = parseTimeToMinutes(endTimeStr);

    if (startMinutes >= endMinutes) {
        alert("Время окончания занятия должно быть позже времени начала.");
        return;
    }

    const lessonData = {
        subjectId: parseInt(subjectId),
        professorId: parseInt(professorId),
        classroomId: parseInt(classroomId),
        time: tm,
        day: 0 // Для буфера устанавливаем день 0
    };

    try {
        const newLessonFromServer = await createLesson(lessonData); // Отправляем данные на сервер

        // После успешного создания на сервере, создаем DOM-элемент
        const id = "lesson-" + newLessonFromServer.id; // Используем ID от сервера
        const d = document.createElement('div');
        d.className = 'lesson'; d.id = id; d.draggable = true;
        d.ondragstart = window.drag;
        d.dataset.day = newLessonFromServer.day; // Устанавливаем data-day: 0
        d.dataset.subjectId = newLessonFromServer.subject.id;
        d.dataset.professorId = newLessonFromServer.professor.id;
        d.dataset.classroomId = newLessonFromServer.classroom.id;

        d.innerHTML = `
            <div class="lesson-title">${newLessonFromServer.subject.name}</div>
            <div>${newLessonFromServer.professor.name}, ${newLessonFromServer.classroom.number}</div>
            <div class="lesson-time">${newLessonFromServer.time}</div>
        `;
        document.getElementById('buffer').appendChild(d);

        // Очистка полей формы после создания карточки
        subjectSelect.value = '';
        teacherSelect.value = '';
        classroomSelect.value = '';
        document.getElementById('timeInput').value = '';

    } catch (error) {
        alert("Не удалось создать занятие: " + error.message);
        console.error("Error creating lesson in UI:", error);
    }
}
