export function parseTimeToMinutes(t) {
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + m;
}

export function isValidTimeRange(timeStr) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeStr);
}
