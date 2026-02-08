export function parseTimeToMinutes(t) {
    if (!t) return 0; // Добавлена проверка на null/undefined
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + m;
}

export function isValidTimeRange(timeStr) {
    const timeRegex = /^(\d{1,2}):([0-5]\d)-(\d{1,2}):([0-5]\d)$/;
    const match = timeStr.match(timeRegex);

    if (!match) {
        return false;
    }

    const startHour = parseInt(match[1]);
    const endHour = parseInt(match[3]);

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        return false;
    }

    return true;
}
