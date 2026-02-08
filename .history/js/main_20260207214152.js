import { openTab } from './tabManager.js';
import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';
import { getProfessors, getClassrooms } from './api.js'; // Импортируем функции API

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;

document.addEventListener('DOMContentLoaded', async () => { // Делаем функцию асинхронной
    // Заполняем выпадающие списки асинхронно
    const professors = await getProfessors();
    populateSelect('teacherSelect', professors);

    const classrooms = await getClassrooms();
    populateSelect('classroomSelect', classrooms);

    // Настраиваем контекстное меню
    setupContextMenu();
});
