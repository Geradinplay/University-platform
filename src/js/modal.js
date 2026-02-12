(function(){
  let modalTimeout;

  function showModal(title, message, duration = 3000) {
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
    if (modalCloseBtn) modalCloseBtn.onclick = () => hideModal();
  }

  function showConflictConfirmationModal(message, onConfirm, onCancel) {
    const conflictModal = document.getElementById('conflict-modal');
    const conflictDetails = document.getElementById('conflict-details');
    const conflictConfirmBtn = document.getElementById('conflict-confirm');
    const conflictCancelBtn = document.getElementById('conflict-cancel');

    if (!conflictModal || !conflictDetails || !conflictConfirmBtn || !conflictCancelBtn) {
        console.error('Conflict modal elements not found.');
        return;
    }

    conflictDetails.innerHTML = message;
    conflictModal.classList.add('active');

    conflictConfirmBtn.onclick = () => {
        conflictModal.classList.remove('active');
        if (onConfirm) onConfirm();
    };

    conflictCancelBtn.onclick = () => {
        conflictModal.classList.remove('active');
        if (onCancel) onCancel();
    };

    // Закрытие по клику вне модального окна (опционально)
    conflictModal.onclick = (e) => {
        if (e.target === conflictModal) {
            conflictModal.classList.remove('active');
            if (onCancel) onCancel();
        }
    };
  }

  function hideModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
      modal.classList.remove('active');
      if (modalTimeout) {
        clearTimeout(modalTimeout);
        modalTimeout = null;
      }
    }
  }

  window.showModal = showModal;
  window.showConflictConfirmationModal = showConflictConfirmationModal;
  window.hideModal = hideModal;
})();
