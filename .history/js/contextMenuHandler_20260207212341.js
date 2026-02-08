let targetToDelete = null;

export function setupContextMenu() {
    window.oncontextmenu = (e) => {
        const item = e.target.closest('.lesson') || e.target.closest('.break-block');
        if (item) {
            e.preventDefault();
            targetToDelete = item;
            const m = document.getElementById('context-menu');
            m.style.display = 'block'; m.style.left = e.pageX + 'px'; m.style.top = e.pageY + 'px';
        }
    };
    window.onclick = () => { document.getElementById('context-menu').style.display = 'none'; };
}

export function deleteItem() {
    if (targetToDelete) {
        // Если удаляемый элемент - это занятие и включены авто-перерывы
        if (targetToDelete.classList.contains('lesson') && document.getElementById('breakToggle').checked) {
            const nextSibling = targetToDelete.nextSibling;
            // Проверяем, является ли следующий элемент блоком перерыва
            if (nextSibling && nextSibling.classList.contains('break-block')) {
                nextSibling.remove(); // Удаляем блок перерыва
            }
        }
        targetToDelete.remove(); // Удаляем сам элемент (занятие или перерыв)
    }
}
