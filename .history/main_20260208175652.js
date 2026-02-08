import { openTab } from './tabManager.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms, getSchedule, getSubjects } from './api.js';
import { parseTimeToMinutes } from './utils.js';
import { populateSelect } from './selectPopulator.js';

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Заполняем выпадающие списки асинхронно
    const subjects = await getSubjects();
    populateSelect('subjectSelect', subjects, 'name');

    const professors = await getProfessors();
    populateSelect('teacherSelect', professors, 'name');

    const classrooms = await getClassrooms();
    populateSelect('classroomSelect', classrooms, 'number');

    // Настраиваем контекстное меню
    setupContextMenu();

    // Загружаем и отображаем расписание
    const schedule = await getSchedule();
    const dayContainers = document.querySelectorAll('.table-container tbody .day');

    schedule.forEach(lessonData => {
      if (lessonData.day >= 0 && lessonData.day <= dayContainers.length) {
        let targetContainer;
        if (lessonData.day === 0) {
          targetContainer = document.getElementById('buffer');
        } else {
          targetContainer = dayContainers[lessonData.day - 1];
        }
        
        if (!targetContainer) return;

        const d = document.createElement('div');
        d.className = 'lesson';
        d.id = "lesson-" + lessonData.id;
        d.draggable = true;
        d.ondragstart = window.drag;
        d.ondragover = window.allowDrop;
        d.ondrop = window.drop;
        d.dataset.day = lessonData.day;
        d.dataset.subjectId = lessonData.subject.id;
        d.dataset.professorId = lessonData.professor.id;
        d.dataset.classroomId = lessonData.classroom.id;

        const infoString = `${lessonData.professor.name}, ${lessonData.classroom.number}`;
        const timeDisplay = lessonData.startTime && lessonData.endTime 
          ? `${lessonData.startTime}-${lessonData.endTime}`
          : lessonData.time || 'N/A';

        d.innerHTML = `
          <div class="lesson-title">${lessonData.subject.name}</div>
          <div>${infoString}</div>
          <div class="lesson-time">${timeDisplay}</div>
        `;
        
        if (lessonData.day !== 0) {
          const newLessonStartTime = parseTimeToMinutes(timeDisplay.split('-')[0]);
          let insertReferenceNode = null;
          for (const child of Array.from(targetContainer.children)) {
            if (child.classList.contains('lesson')) {
              const existingLessonTime = parseTimeToMinutes(child.querySelector('.lesson-time').innerText.split('-')[0]);
              if (newLessonStartTime < existingLessonTime) {
                insertReferenceNode = child;
                break;
              }
            }
          }
          targetContainer.insertBefore(d, insertReferenceNode);
        } else {
          targetContainer.appendChild(d);
        }

        if (lessonData.day !== 0 && document.getElementById('breakToggle')?.checked) {
          if (!(d.nextSibling && d.nextSibling.classList.contains('break-block'))) {
            const min = document.getElementById('breakDuration')?.value || 10;
            const b = document.createElement('div');
            b.className = 'break-block';
            b.innerText = `ПЕРЕРЫВ: ${min} МИН.`;
            targetContainer.insertBefore(b, d.nextSibling);
          }
        }
      }
    });
  } catch (error) {
    console.error("Ошибка при загрузке приложения:", error);
  }
});