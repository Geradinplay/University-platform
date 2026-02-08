import { getProfessors, getClassrooms, getSchedule, getSubjects, createLesson, updateLessonDay } from './api/endpoints.js';
import { renderSchedule } from './ui/renderer.js';
import { allowDrop, drag, drop } from './ui/dragDrop.js';
import { Logger } from './infrastructure/logger.js';

window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const subjects = await getSubjects();
    const professors = await getProfessors();
    const classrooms = await getClassrooms();
    const schedule = await getSchedule();

    Logger.info("Data loaded successfully");

    const scheduleContainer = document.getElementById("schedule");
    if (scheduleContainer) {
      renderSchedule(schedule, scheduleContainer);
    }
  } catch (error) {
    Logger.error("Failed to load application data", error);
  }
});
