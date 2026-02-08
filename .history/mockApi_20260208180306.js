// Простая база данных в памяти для моковых данных
let mockSubjects = [
  { id: 1, name: 'Математика' },
  { id: 2, name: 'Физика' },
  { id: 3, name: 'Литература' },
  { id: 4, name: 'История' },
];

let mockProfessors = [
  { id: 1, name: 'Иван Петров' },
  { id: 2, name: 'Мария Сидорова' },
  { id: 3, name: 'Алексей Кузнецов' },
];

let mockClassrooms = [
  { id: 1, number: '101' },
  { id: 2, number: '202' },
  { id: 3, number: 'Актовый зал' },
];

let mockSchedule = [
  {
    id: 1,
    startTime: '09:00',
    endTime: '10:30',
    day: 1, // Понедельник
    subject: mockSubjects[0], // Математика
    professor: mockProfessors[0], // Иван Петров
    classroom: mockClassrooms[0], // 101
    breakInfo: null,
  },
  {
    id: 2,
    startTime: '10:30',
    endTime: '12:00',
    day: 0, // Буфер
    subject: mockSubjects[1], // Физика
    professor: mockProfessors[1], // Мария Сидорова
    classroom: mockClassrooms[1], // 202
    breakInfo: null,
  },
  {
    id: 3,
    startTime: '13:00',
    endTime: '14:30',
    day: 1, // Понедельник
    subject: mockSubjects[2], // Литература
    professor: mockProfessors[2], // Алексей Кузнецов
    classroom: mockClassrooms[2], // Актовый зал
    breakInfo: null,
  },
];

let nextLessonId = Math.max(...mockSchedule.map(l => l.id)) + 1 || 1;

// --- Mock API Functions ---

export async function getProfessors() {
  return Promise.resolve(mockProfessors);
}

export async function getClassrooms() {
  return Promise.resolve(mockClassrooms);
}

export async function getSubjects() {
  return Promise.resolve(mockSubjects);
}

export async function getSchedule() {
  return Promise.resolve(mockSchedule);
}

export async function createLesson(lessonData) {
  const newLesson = {
    id: nextLessonId++,
    startTime: lessonData.time.split('-')[0],
    endTime: lessonData.time.split('-')[1],
    day: lessonData.day,
    subject: mockSubjects.find(s => s.id === lessonData.subjectId),
    professor: mockProfessors.find(p => p.id === lessonData.professorId),
    classroom: mockClassrooms.find(c => c.id === lessonData.classroomId),
    breakInfo: null,
  };
  mockSchedule.push(newLesson);
  console.log("Mock API: Lesson created:", newLesson);
  return Promise.resolve(newLesson);
}

export async function updateLessonDay(lessonId, newDay) {
  const lessonIndex = mockSchedule.findIndex(l => l.id == lessonId);
  if (lessonIndex !== -1) {
    mockSchedule[lessonIndex].day = newDay;
    console.log(`Mock API: Lesson ${lessonId} updated to day ${newDay}`);
    return Promise.resolve(true);
  }
  return Promise.reject(new Error("Lesson not found in mock data"));
}

export async function deleteLesson(lessonId) {
  const initialLength = mockSchedule.length;
  mockSchedule = mockSchedule.filter(l => l.id != lessonId);
  if (mockSchedule.length < initialLength) {
    console.log(`Mock API: Lesson ${lessonId} deleted.`);
    return Promise.resolve(true);
  }
  return Promise.reject(new Error("Lesson not found in mock data"));
}

// Заглушка для BreakService, если он когда-либо будет использоваться напрямую
export async function deleteBreak(breakId) {
  console.log(`Mock API: Break ${breakId} (not actually stored) would be deleted.`);
  return Promise.resolve(true);
}
