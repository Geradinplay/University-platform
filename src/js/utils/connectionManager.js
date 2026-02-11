/**
 * Connection Manager для управления подключением к серверу
 * Обеспечивает автоматическое переподключение при восстановлении сервера
 */

const RETRY_INTERVALS = [1000, 2000, 5000, 10000, 30000]; // ms
const MAX_RETRIES = 5;

class ConnectionManager {
    constructor() {
        this.isConnected = false;
        this.retryCount = 0;
        this.initializationCallbacks = [];
        this.reconnectionCallbacks = [];
        this.isInitialized = false;
        this.checkInterval = null;
    }

    /**
     * Обновляет визуальный индикатор соединения
     */
    updateStatusIndicator(status) {
        try {
            const indicator = document.getElementById('connection-status');
            if (!indicator) {
                console.debug('ConnectionManager: Элемент connection-status еще не загружен в DOM');
                return;
            }

            const dot = indicator.querySelector('.connection-dot');
            const text = indicator.querySelector('.connection-text');

            if (!dot || !text) {
                console.debug('ConnectionManager: Дочерние элементы connection-status не найдены');
                return;
            }

            indicator.classList.remove('connected', 'disconnected', 'waiting');
            dot.classList.remove('connected', 'disconnected');

            switch (status) {
                case 'connected':
                    indicator.classList.add('connected');
                    dot.classList.add('connected');
                    text.textContent = 'Подключено';
                    break;
                case 'disconnected':
                    indicator.classList.add('disconnected');
                    dot.classList.add('disconnected');
                    text.textContent = 'Нет подключения';
                    break;
                case 'waiting':
                    indicator.classList.add('waiting');
                    dot.classList.add('disconnected');
                    text.textContent = `Переподключение... (${this.retryCount}/${MAX_RETRIES})`;
                    break;
                default:
                    indicator.classList.add('waiting');
                    dot.classList.add('disconnected');
                    text.textContent = 'Подключение...';
            }
        } catch (err) {
            console.debug('ConnectionManager: Ошибка при обновлении индикатора:', err.message);
        }
    }

    /**
     * Регистрирует callback для выполнения при успешной инициализации
     */
    onInitialization(callback) {
        this.initializationCallbacks.push(callback);
        // Если уже инициализирован, выполняем сразу
        if (this.isInitialized && this.isConnected) {
            callback();
        }
    }

    /**
     * Регистрирует callback для выполнения при переподключении к серверу
     */
    onReconnection(callback) {
        this.reconnectionCallbacks.push(callback);
    }

    /**
     * Проверяет доступность сервера
     */
    async checkConnection() {
        try {
            // Пытаемся сделать простой GET запрос к серверу
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('http://localhost:8080/api/faculties', {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);
            // Любой валидный HTTP ответ (даже 401, 403) означает, что сервер доступен
            return response.ok || response.status === 401 || response.status === 403;
        } catch (error) {
            console.debug('ConnectionManager: Сервер недоступен', error.message);
            return false;
        }
    }

    /**
     * Запускает процесс инициализации приложения
     */
    async initialize(initFunction) {
        try {
            console.log('🔍 ConnectionManager: Проверяю соединение с сервером...');
            this.updateStatusIndicator('default');

            // Проверяем соединение перед инициализацией
            if (!await this.checkConnection()) {
                console.warn('⚠️ Сервер недоступен. Жду восстановления подключения...');
                this.isConnected = false;
                this.updateStatusIndicator('disconnected');
                this.setupReconnectionCheck(initFunction);
                return;
            }

            // Сервер доступен, инициализируем
            console.log('✅ Соединение установлено. Инициализирую приложение...');
            await initFunction();

            this.isConnected = true;
            this.isInitialized = true;
            this.retryCount = 0;
            this.updateStatusIndicator('connected');

            // Выполняем все зарегистрированные callbacks инициализации
            this.initializationCallbacks.forEach(cb => {
                try {
                    cb();
                } catch (err) {
                    console.error('Ошибка в callback инициализации:', err);
                }
            });

            console.log('✅ Приложение успешно инициализировано');

        } catch (error) {
            console.error('❌ Ошибка при инициализации:', error);
            this.isConnected = false;
            this.updateStatusIndicator('disconnected');
            this.setupReconnectionCheck(initFunction);
        }
    }

    /**
     * Устанавливает проверку переподключения
     */
    setupReconnectionCheck(initFunction) {
        // Очищаем предыдущий интервал если существует
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        const attemptReconnection = async () => {
            if (this.retryCount >= MAX_RETRIES) {
                console.error('❌ Максимальное количество попыток переподключения достигнуто');
                this.updateStatusIndicator('disconnected');
                return;
            }

            const waitTime = RETRY_INTERVALS[Math.min(this.retryCount, RETRY_INTERVALS.length - 1)];
            console.log(`⏳ ConnectionManager: Попытка ${this.retryCount + 1}/${MAX_RETRIES} через ${waitTime}ms...`);
            this.updateStatusIndicator('waiting');

            setTimeout(async () => {
                try {
                    if (await this.checkConnection()) {
                        console.log('✅ Сервер восстановлен! Переинициализирую приложение...');

                        // Если еще не инициализировали, инициализируем
                        if (!this.isInitialized) {
                            await initFunction();
                            this.isInitialized = true;
                            this.initializationCallbacks.forEach(cb => {
                                try {
                                    cb();
                                } catch (err) {
                                    console.error('Ошибка в callback инициализации:', err);
                                }
                            });
                        } else {
                            // Если уже инициализировали, вызываем callback переподключения
                            this.reconnectionCallbacks.forEach(cb => {
                                try {
                                    cb();
                                } catch (err) {
                                    console.error('Ошибка в callback переподключения:', err);
                                }
                            });
                        }

                        this.isConnected = true;
                        this.retryCount = 0;
                        this.updateStatusIndicator('connected');
                        clearInterval(this.checkInterval);
                    } else {
                        this.retryCount++;
                        attemptReconnection();
                    }
                } catch (error) {
                    console.error('Ошибка при проверке подключения:', error);
                    this.retryCount++;
                    attemptReconnection();
                }
            }, waitTime);
        };

        attemptReconnection();
    }

    /**
     * Проверяет, готово ли приложение
     */
    isReady() {
        return this.isInitialized && this.isConnected;
    }

    /**
     * Ручное переподключение
     */
    async reconnect(initFunction) {
        this.retryCount = 0;
        this.isInitialized = false;
        await this.initialize(initFunction);
    }
}

export const connectionManager = new ConnectionManager();


