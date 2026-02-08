import { deleteLesson, deleteBreak } from './api.js'; // ИЗМЕНЕНО: Добавлен deleteBreak

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
            m.style.left = e.clientX + 'px'; // ИЗМЕНЕНО: Используем clientX для точного позиционирования
            m.style.top = e.clientY + 'px';  // ИЗМЕНЕНО: Используем clientY для точного позиционирования
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
            // И если есть автоматический перерыв сразу после него, удаляем и его с сервера
            if (targetToDelete.classList.contains('lesson')) {
                const nextSibling = targetToDelete.nextSibling;
                if (nextSibling && nextSibling.classList.contains('break-block')) {
                    const breakIdToDelete = nextSibling.dataset.breakId;
                    if (breakIdToDelete) {
                        console.log("ContextMenu: Attempting to delete associated break with ID:", breakIdToDelete); // ДОБАВЛЕНО
                        try {
                            await deleteBreak(breakIdToDelete); // ДОБАВЛЕНО: Удаление перерыва на сервере
                            console.log(`Debug: Server break ${breakIdToDelete} deleted with lesson.`);
                        } catch (error) {
                            console.error("Failed to delete break from server with lesson:", error);
                        }
                    } else {
                        console.warn("ContextMenu: No breakId found for associated break-block."); // ДОБАВЛЕНО
                    }
                    nextSibling.remove();
                }
            }
            targetToDelete.remove();
            targetToDelete = null;
        } catch (error) {
            alert("Не удалось удалить занятие: " + error.message);
            console.error("Error deleting lesson from API:", error);
        }
    } else if (targetToDelete.classList.contains('break-block')) {
        const breakId = targetToDelete.dataset.breakId; // Получаем breakId из dataset
        if (breakId) {
            console.log("ContextMenu: Attempting to delete break with ID:", breakId);
            try {
                await deleteBreak(Number(breakId)); // Преобразуем к числу
                targetToDelete.remove();
                targetToDelete = null;
                console.log(`Client-side break block and server break ${breakId} removed.`);
            } catch (error) {
                 alert("Не удалось удалить перерыв с сервера: " + error.message);
                 console.error("Error deleting break from API:", error);
            }
        } else {
            console.warn("Attempted to delete break-block without a dataset.breakId. Removing from DOM only.");
            targetToDelete.remove(); // Если ID нет, удаляем только из DOM
            targetToDelete = null;
        }
    }
}
