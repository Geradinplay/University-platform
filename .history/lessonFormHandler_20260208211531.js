import { isValidTimeRange, parseTimeToMinutes } from './utils.js';
import { createLesson } from './api.js'; 

export async function addNewLesson() {
    const subjectSelect = document.getElementById('subjectSelect');
    const teacherSelect = document.getElementById('teacherSelect');
    const classroomSelect = document.getElementById('classroomSelect');
    
    const subjectId = subjectSelect.value;
    const professorId = teacherSelect.value;
    const classroomId = classroomSelect.value;

    const selectedSubjectName = subjectSelect.options[subjectSelect.selectedIndex].textContent;
    const selectedTeacherName = teacherSelect.options[teacherSelect.selectedIndex].textContent;
    const selectedClassroomNumber = classroomSelect.options[classroomSelect.selectedIndex].textContent;
    
    const tm = document.getElementById('timeInput').value.trim();

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
    // ДОБАВЛЕНО: Форматируем время в HH:MM с ведущими нулями
    function formatTime(t) {
        const [h, m] = t.trim().split(':').map(Number);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    const formattedStartTime = formatTime(startTimeStr);
    const formattedEndTime = formatTime(endTimeStr);

    const startMinutes = parseTimeToMinutes(formattedStartTime);
    const endMinutes = parseTimeToMinutes(formattedEndTime);

    if (startMinutes >= endMinutes) {
        alert("Время окончания занятия должно быть позже времени начала.");
        return;
    }

    const lessonData = {
        startTime: formattedStartTime, // Передаем startTime и endTime отдельно
        endTime: formattedEndTime,
        day: 0, // Для буфера
        subjectId: subjectId, // Не преобразуем в число!
        professorId: professorId,
        classroomId: classroomId
    };

    try {
        const newLessonFromServer = await createLesson(lessonData);

        const id = "lesson-" + newLessonFromServer.id;
        const d = document.createElement('div');
        d.className = 'lesson'; d.id = id; d.draggable = true;
        d.ondragstart = window.drag;
        d.ondragover = window.allowDrop; 
        d.ondrop = window.drop; 
        d.dataset.day = newLessonFromServer.day;
        d.dataset.subjectId = newLessonFromServer.subject.id;
        d.dataset.professorId = newLessonFromServer.professor.id;
        d.dataset.classroomId = newLessonFromServer.classroom.id;
        // ДОБАВЛЕНО: Добавляем startTime и endTime в dataset для dragDropHandler
        d.dataset.startTime = newLessonFromServer.startTime;
        d.dataset.endTime = newLessonFromServer.endTime;


        d.innerHTML = `
            <div class="lesson-title">${newLessonFromServer.subject.name}</div>
            <div>${newLessonFromServer.professor.name}, ${newLessonFromServer.classroom.number}</div>
            <div class="lesson-time">${newLessonFromServer.startTime}-${newLessonFromServer.endTime}</div>
        `;
        // ИЗМЕНЕНО: Добавляем карточку в контейнер для буфера
        document.getElementById('buffer-content').appendChild(d); 

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
