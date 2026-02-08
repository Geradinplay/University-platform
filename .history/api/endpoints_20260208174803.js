export async function getProfessors() {
  try {
    return await apiClient.get("/api/professors");
  } catch (error) {
    console.error("Error fetching professors:", error);
    return [];
  }
}

export async function getClassrooms() {
  try {
    return await apiClient.get("/api/classrooms");
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return [];
  }
}

export async function getSchedule() {
  try {
    return await apiClient.get("/api/schedule");
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
}

export async function getSubjects() {
  try {
    return await apiClient.get("/api/subjects");
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
}

export async function createLesson(lessonData) {
  try {
    return await apiClient.post("/api/schedule", lessonData);
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
}

export async function updateLessonDay(lessonId, newDay) {
  try {
    return await apiClient.patch(`/api/schedule/${lessonId}`, { day: newDay });
  } catch (error) {
    console.error(`Error updating lesson ${lessonId}:`, error);
    throw error;
  }
}
