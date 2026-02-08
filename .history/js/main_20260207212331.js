import { openTab } from './tabManager.js';
import { mockTeachers, mockClassrooms } from './data.js';
import { populateSelect } from './selectPopulator.js';
import { allowDrop, drag, drop } from './dragDropHandler.js';
import { addNewLesson } from './lessonFormHandler.js';
import { setupContextMenu, deleteItem } from './contextMenuHandler.js';

// Делаем функции глобально доступными для встроенных обработчиков событий HTML
window.openTab = openTab;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;
window.addNewLesson = addNewLesson;
window.deleteItem = deleteItem;

document.addEventListener('DOMContentLoaded', () => {
    // Заполняем выпадающие списки
    populateSelect('teacherSelect', mockTeachers);
    populateSelect('classroomSelect', mockClassrooms);

    // Настраиваем контекстное меню
    setupContextMenu();
});
