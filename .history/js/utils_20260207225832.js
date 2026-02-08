export function parseTimeToMinutes(t) {
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + m;
}

export function isValidTimeRange(timeStr) {
    // Изменено: позволяет одноразрядные часы (например, 8:00)
    const timeRegex = /^(\d{1,2}):([0-5]\d)-(\d{1,2}):([0-5]\d)$/;
    const match = timeStr.match(timeRegex);

    if (!match) {
        return false;
    }

    // Дополнительная валидация значений часов (0-23)
    const startHour = parseInt(match[1]);
    const endHour = parseInt(match[3]);

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        return false;
    }

    return true;
}
