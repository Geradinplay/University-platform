function showConnectionModal() {
  // Удаляем старую модалку, если она есть
  const oldModal = document.getElementById('connection-modal');
  if (oldModal) oldModal.remove();

  // Создаём стили
  const style = document.createElement('style');
  style.textContent = `
    #connection-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    #connection-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 70px;
      height: 70px;
    }
    #connection-spinner-inner {
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      box-sizing: border-box;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
  `;
  document.head.appendChild(style);

  // Создаём модалку
  const modal = document.createElement('div');
  modal.id = 'connection-modal';
  modal.innerHTML = `
    <div id="connection-spinner">
      <div id="connection-spinner-inner"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

function hideConnectionModal() {
  const modal = document.getElementById('connection-modal');
  if (modal) modal.remove();
}

function pollHealth() {
  fetch('/actuator/health')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      console.log('Health check response:', data); // Для отладки
      if (data && data.status && data.status.toUpperCase() === 'UP') {
        hideConnectionModal();
      } else {
        setTimeout(pollHealth, 2000);
      }
    })
    .catch(err => {
      console.warn('Health check error:', err);
      setTimeout(pollHealth, 2000);
    });
}

// Показываем модалку и запускаем опрос
showConnectionModal();
pollHealth();