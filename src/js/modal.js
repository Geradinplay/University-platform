let modalTimeout;

/**
 * Показывает красивое модальное окно с заданным заголовком и сообщением.
 * Автоматически скрывает его через заданное время.
 * @param {string} title - Заголовок модального окна.
 * @param {string} message - Сообщение, отображаемое в модальном окне.
 * @param {number} duration - Длительность отображения модального окна в миллисекундах (по умолчанию 3000 мс).
 */
export function showModal(title, message, duration = 3000) {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('app-modal-title');
    const modalMessage = document.getElementById('app-modal-message');
    const modalCloseBtn = document.getElementById('app-modal-close');

    if (!modal || !modalTitle || !modalMessage) {
        console.error('Modal elements not found.');
        return;
    }

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('active'); // Показываем модальное окно

    // Очищаем предыдущий таймаут, если он был
    if (modalTimeout) {
        clearTimeout(modalTimeout);
    }

    // Автоматически скрываем модальное окно через заданное время
    modalTimeout = setTimeout(() => {
        hideModal();
    }, duration);

    // Добавляем обработчик для кнопки закрытия
    modalCloseBtn.onclick = () => hideModal();
}

/**
 * Скрывает модальное окно.
 */
export function hideModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.classList.remove('active');
        if (modalTimeout) {
            clearTimeout(modalTimeout);
            modalTimeout = null;
        }
    }
}
