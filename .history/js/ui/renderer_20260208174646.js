function renderLesson(lesson) {
  const startTime = lesson.startTime || "N/A";
  const endTime = lesson.endTime || "N/A";
  const subjectName = lesson.subject?.name || "N/A";
  const professorName = lesson.professor?.name || "N/A";
  const classroomNumber = lesson.classroom?.number || "N/A";
  
  const lessonEl = document.createElement("div");
  lessonEl.className = "lesson";
  lessonEl.draggable = true;
  lessonEl.dataset.lessonId = lesson.id;
  lessonEl.innerHTML = `
    <p><strong>${subjectName}</strong></p>
    <p>Время: ${startTime} - ${endTime}</p>
    <p>Преподаватель: ${professorName}</p>
    <p>Аудитория: ${classroomNumber}</p>
  `;
  
  attachDragListeners(lessonEl);
  return lessonEl;
}

function renderSchedule(lessons, container) {
  container.innerHTML = "";
  
  if (!Array.isArray(lessons) || lessons.length === 0) {
    container.innerHTML = "<p>Расписание пусто</p>";
    return;
  }
  
  lessons.forEach((lesson) => {
    const lessonEl = renderLesson(lesson);
    container.appendChild(lessonEl);
  });
}
