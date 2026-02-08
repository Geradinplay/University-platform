import { deleteLesson } from './api.js'; 
// import { deleteBreak } from './api.js'; // Пока не используется, так как авто-перерывы не имеют серверного ID

let targetToDelete = null; // Элемент, по которому был сделан правый клик

export function setupContextMenu() {
    window.oncontextmenu = (e) => {
        if (item) {
            e.preventDefault();
            targetToDelete = item;
            const m = document.getElementById('context-menu');
            m.style.display = 'block'; m.style.left = e.pageX + 'px'; m.style.top = e.pageY + 'px';
        }
    };
    window.onclick = () => { document.getElementById('context-menu').style.display = 'none'; };
}

export async function deleteItem() {
    if (targetToDelete) {
        const lessonId = targetToDelete.id.replace('lesson-', '');
        try {
            await deleteLesson(lessonId); // Отправляем запрос на удаление через API
            
            // Если удаляемый элемент - это занятие и включены авто-перерывы
            if (targetToDelete.classList.contains('lesson')) {
                const nextSibling = targetToDelete.nextSibling;
                // Проверяем, является ли следующий элемент блоком перерыва
                if (nextSibling && nextSibling.classList.contains('break-block')) {
                    nextSibling.remove(); // Удаляем блок перерыва
                }
            }
            targetToDelete.remove();
            targetToDelete = null;
        } catch (error) {
            alert("Не удалось удалить занятие: " + error.message);
            console.error("Error deleting lesson from API:", error);
        }
    }
}
