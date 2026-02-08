export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
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
