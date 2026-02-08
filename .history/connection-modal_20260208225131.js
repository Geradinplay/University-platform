function showConnectionModal() {
  // Создаём стили
  const style = document.createElement('style');
  style.textContent = `
    #connection-modal {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    #connection-spinner {
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
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
  modal.innerHTML = `<div id="connection-spinner"></div>`;
  document.body.appendChild(modal);
}

function hideConnectionModal() {
  const modal = document.getElementById('connection-modal');
  if (modal) modal.remove();
}

function pollHealth() {
  fetch('/actuator/health')
    .then(res => res.json())
    .then(data => {
      if (data.status === 'UP') {
        hideConnectionModal();
      } else {
        setTimeout(pollHealth, 2000);
      }
    })
    .catch(() => setTimeout(pollHealth, 2000));
}

// Показываем модалку и запускаем опрос
showConnectionModal();
pollHealth();