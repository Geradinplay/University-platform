/**
 * Модуль аутентификации
 * Управляет логином и регистрацией пользователей
 */

import { login, register } from '../../../api/api.js';

let currentMode = 'login'; // 'login' или 'register'

/**
 * Инициализация страницы авторизации
 */
export function initAuthPage() {
    renderAuthForm();
    setupEventListeners();
}

/**
 * Рендеринг формы авторизации
 */
function renderAuthForm() {
    const authContainer = document.getElementById('auth-container') || createAuthContainer();

    authContainer.innerHTML = `
        <div style="max-width: 400px; margin: 60px auto; padding: 32px; background: #fff; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; margin-bottom: 24px; color: #333;">
                ${currentMode === 'login' ? 'Вход' : 'Регистрация'}
            </h2>
            
            <div id="error-message" style="display: none; background: #ffeaea; color: #c00; padding: 12px 16px; border-radius: 6px; margin-bottom: 18px; text-align: center; font-weight: 500;"></div>
            
            <form id="auth-form">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Имя пользователя</label>
                    <input 
                        type="text" 
                        id="username-input" 
                        placeholder="Введите имя пользователя"
                        required
                        style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; font-size: 14px;"
                    />
                </div>
                
                ${currentMode === 'register' ? `
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Email</label>
                    <input 
                        type="email" 
                        id="email-input" 
                        placeholder="Введите email"
                        required
                        style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; font-size: 14px;"
                    />
                </div>
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">Пароль</label>
                    <input 
                        type="password" 
                        id="password-input" 
                        placeholder="Введите пароль"
                        required
                        style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; font-size: 14px;"
                    />
                </div>
                
                <button 
                    type="submit" 
                    style="width: 100%; padding: 12px; border-radius: 6px; background: #5b9bd5; color: #fff; font-weight: 600; border: none; font-size: 16px; cursor: pointer; transition: background 0.2s;"
                    onmouseover="this.style.background='#4a89c3'"
                    onmouseout="this.style.background='#5b9bd5'"
                >
                    ${currentMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </form>
            
            <div style="margin-top: 18px; text-align: center; color: #666; font-size: 14px;">
                ${currentMode === 'login' ? 
                    `Нет аккаунта? <button id="toggle-mode-btn" style="color: #5b9bd5; background: none; border: none; cursor: pointer; text-decoration: underline; font-weight: 500;">Зарегистрироваться</button>` 
                    : 
                    `Уже есть аккаунт? <button id="toggle-mode-btn" style="color: #5b9bd5; background: none; border: none; cursor: pointer; text-decoration: underline; font-weight: 500;">Войти</button>`
                }
            </div>
        </div>
    `;
}

/**
 * Создание контейнера для формы авторизации
 */
function createAuthContainer() {
    const container = document.createElement('div');
    container.id = 'auth-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Установка обработчиков событий
 */
function setupEventListeners() {
    const form = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('toggle-mode-btn');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentMode = currentMode === 'login' ? 'register' : 'login';
            renderAuthForm();
            setupEventListeners();
        });
    }
}

/**
 * Обработка отправки формы
 */
async function handleSubmit(e) {
    e.preventDefault();

    const username = document.getElementById('username-input').value.trim();
    const password = document.getElementById('password-input').value.trim();
    const email = currentMode === 'register' ? document.getElementById('email-input')?.value.trim() : '';
    const errorDiv = document.getElementById('error-message');

    // Проверка полей
    if (!username || !password) {
        showError('Пожалуйста, заполните все поля');
        return;
    }

    if (currentMode === 'register' && !email) {
        showError('Пожалуйста, введите email');
        return;
    }

    if (password.length < 3) {
        showError('Пароль должен быть не менее 3 символов');
        return;
    }

    try {
        if (currentMode === 'login') {
            const result = await login(username, password);
            console.log('✅ Успешный вход:', result);
            showError(''); // Очищаем ошибку

            // Перенаправляем на главную страницу после успешного входа
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } else {
            const result = await register(username, email, password);
            console.log('✅ Успешная регистрация:', result);
            showError(''); // Очищаем ошибку

            // Переходим на логин после успешной регистрации
            setTimeout(() => {
                currentMode = 'login';
                renderAuthForm();
                setupEventListeners();
                showError('Регистрация успешна! Теперь вы можете войти');
            }, 500);
        }
    } catch (error) {
        console.error('❌ Ошибка при авторизации:', error);
        showError(error.message || 'Ошибка при авторизации. Попробуйте еще раз.');
    }
}

/**
 * Показ сообщения об ошибке
 */
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        if (message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.style.background = message.includes('успеш') ? '#e6ffe6' : '#ffeaea';
            errorDiv.style.color = message.includes('успеш') ? '#0a6a0a' : '#c00';
        } else {
            errorDiv.style.display = 'none';
        }
    }
}

/**
 * Проверка наличия токена в localStorage
 */
export function isLoggedIn() {
    return !!localStorage.getItem('jwt');
}

/**
 * Получение текущего пользователя
 */
export function getCurrentUser() {
    return localStorage.getItem('username');
}

/**
 * Выход пользователя
 */
export function logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('username');
    window.location.href = '/auth.html';
}

