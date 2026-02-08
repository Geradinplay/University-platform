import { deleteLesson } from './api.js'; 
// import { deleteBreak } from './api.js'; // Пока не используется, так как авто-перерывы не имеют серверного ID

let targetToDelete = null; // Элемент, по которому был сделан правый клик

export function setupContextMenu() {
    window.oncontextmenu = (e) => {
        // ИЗМЕНЕНО: Теперь таргетируем и .lesson, и .break-block
        const item = e.target.closest('.lesson') || e.target.closest('.break-block');
        if (item) {
            e.preventDefault();
            targetToDelete = item; // Сохраняем элемент
            const m = document.getElementById('context-menu');
            m.style.display = 'block'; 
            m.style.left = e.pageX + 'px'; // Позиционируем по координатам клика
            m.style.top = e.pageY + 'px';
        }
    };
    window.onclick = () => { document.getElementById('context-menu').style.display = 'none'; };
}

export async function deleteItem() {
    if (!targetToDelete) return; // Если нет элемента для удаления, выходим

    // Закрываем контекстное меню
    document.getElementById('context-menu').style.display = 'none';

    if (targetToDelete.classList.contains('lesson')) {
        const lessonId = targetToDelete.id.replace('lesson-', '');
        try {
            await deleteLesson(lessonId); // Отправляем запрос на удаление урока через API
            
            // Если урок успешно удален с сервера, удаляем его из DOM
            // И если есть автоматический перерыв сразу после него, удаляем и его
            if (targetToDelete.classList.contains('lesson')) { // Проверяем еще раз, на всякий случай
                const nextSibling = targetToDelete.nextSibling;
                if (nextSibling && nextSibling.classList.contains('break-block')) {
                    nextSibling.remove(); // Удаляем блок перерыва
                }
            }
            targetToDelete.remove(); // Удаляем сам урок из DOM
            targetToDelete = null; // Очищаем ссылку
        } catch (error) {
            alert("Не удалось удалить занятие: " + error.message);
            console.error("Error deleting lesson from API:", error);
        }
    } else if (targetToDelete.classList.contains('break-block')) {
        // Для автоматических перерывов, которые не имеют серверного ID,
        // просто удаляем их из DOM.
        // Если бы перерывы с сервера имели ID и это был бы такой перерыв,
        // то здесь был бы вызов await deleteBreak(breakId);
        try {
            // Если бы перерыв был из API, он бы имел data-break-id
            // const breakId = targetToDelete.dataset.breakId; 
            // if (breakId) { await deleteBreak(breakId); } // Если перерыв с серверным ID
            
            targetToDelete.remove(); // Удаляем только перерыв из DOM
            targetToDelete = null; // Очищаем ссылку
            console.log("Client-side break block removed.");
        } catch (error) {
             alert("Не удалось удалить перерыв: " + error.message);
             console.error("Error deleting break:", error);
        }
    }
}
