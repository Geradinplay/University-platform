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

// ДОБАВЛЕНО: Моковые данные для перерывов
let mockBreaks = [
  {
    id: 101,
    day: 1, // Понедельник
    startTime: '10:30', // После первого занятия
    endTime: '10:40',
    duration: 10,
    positionAfterLessonId: 1 // Этот перерыв идет после занятия с id 1
  },
  {
    id: 102,
    day: 1, // Понедельник
    startTime: '14:30', // После третьего занятия
    endTime: '14:40',
    duration: 10,
    positionAfterLessonId: 3
  }
];

let nextLessonId = Math.max(...mockSchedule.map(l => l.id)) + 1 || 1;
// ДОБАВЛЕНО: Счетчик ID для перерывов
let nextBreakId = Math.max(...mockBreaks.map(b => b.id)) + 1 || 1001;

// ДОБАВЛЕНО: Моковые данные для расписаний
let mockSchedules = [
  { id: 1, name: 'Расписание 1 группы', facultyId: 1 },
  { id: 2, name: 'Расписание 2 группы', facultyId: 1 }
];
let nextScheduleId = 3;

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

// ДОБАВЛЕНО: Реализация getBreaks
export async function getBreaks() {
  return Promise.resolve(mockBreaks);
}

export async function createLesson(lessonData) {
  const newLesson = {
    id: nextLessonId++,
    startTime: lessonData.startTime || lessonData.time?.split('-')[0],
    endTime: lessonData.endTime || lessonData.time?.split('-')[1],
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

// ДОБАВЛЕНО: Реализация createBreak
export async function createBreak(breakData) {
  const newBreak = {
    id: nextBreakId++,
    day: breakData.day,
    startTime: breakData.startTime,
    endTime: breakData.endTime,
    duration: breakData.duration,
    positionAfterLessonId: breakData.positionAfterLessonId, // Связываем перерыв с занятием
  };
  mockBreaks.push(newBreak);
  console.log("Mock API: Break created:", newBreak);
  return Promise.resolve(newBreak);
}

export async function updateLessonDay(lessonId, dataToUpdate) {
  const lessonIndex = mockSchedule.findIndex(l => l.id == lessonId);
  if (lessonIndex !== -1) {
    mockSchedule[lessonIndex].day = dataToUpdate.day; // Обновляем день занятия
    
    // ДОБАВЛЕНО: Обновляем день для связанных перерывов
    mockBreaks.forEach(b => {
      if (b.positionAfterLessonId === lessonId) {
        b.day = dataToUpdate.day;
        console.log(`Mock API: Break ${b.id} (after lesson ${lessonId}) updated to day ${dataToUpdate.day}`);
      }
    });

    console.log(`Mock API: Lesson ${lessonId} updated to day ${dataToUpdate.day}`);
    return Promise.resolve(true);
  }
  return Promise.reject(new Error("Lesson not found in mock data"));
}

export async function deleteLesson(lessonId) {
  const initialLength = mockSchedule.length;
  mockSchedule = mockSchedule.filter(l => l.id != lessonId);
  if (mockSchedule.length < initialLength) {
    console.log(`Mock API: Lesson ${lessonId} deleted.`);
    // ДОБАВЛЕНО: Удаляем связанные перерывы при удалении занятия
    mockBreaks = mockBreaks.filter(b => b.positionAfterLessonId !== lessonId);
    return Promise.resolve(true);
  }
  return Promise.reject(new Error("Lesson not found in mock data"));
}

// ДОБАВЛЕНО: Реализация deleteBreak
export async function deleteBreak(breakId) {
  console.log("Mock API: Received deleteBreak request for ID:", breakId); // ДОБАВЛЕНО
  const initialLength = mockBreaks.length;
  console.log("Mock API: mockBreaks before filter:", JSON.stringify(mockBreaks)); // ДОБАВЛЕНО
  mockBreaks = mockBreaks.filter(b => b.id != breakId);
  console.log("Mock API: mockBreaks after filter:", JSON.stringify(mockBreaks)); // ДОБАВЛЕНО
  if (mockBreaks.length < initialLength) {
    console.log(`Mock API: Break ${breakId} deleted.`);
    return Promise.resolve(true);
  }
  return Promise.reject(new Error("Break not found in mock data"));
}

// ДОБАВЛЕНО: Реализация updateBreak
export async function updateBreak(breakId, data) {
  const breakIndex = mockBreaks.findIndex(b => b.id == breakId);
  if (breakIndex !== -1) {
    mockBreaks[breakIndex] = { ...mockBreaks[breakIndex], ...data };
    console.log(`Mock API: Break ${breakId} updated:`, mockBreaks[breakIndex]);
    return Promise.resolve(mockBreaks[breakIndex]);
  }
  return Promise.reject(new Error("Break not found in mock data"));
}

// ДОБАВЛЕНО: Mock функции для работы с расписаниями
export async function getSchedules() {
  return Promise.resolve(mockSchedules);
}

export async function getScheduleById(id) {
  const schedule = mockSchedules.find(s => s.id == id);
  return schedule ? Promise.resolve(schedule) : Promise.reject(new Error("Schedule not found"));
}

export async function createSchedule(data) {
  const newSchedule = { id: nextScheduleId++, ...data };
  mockSchedules.push(newSchedule);
  console.log("Mock API: Schedule created:", newSchedule);
  return Promise.resolve(newSchedule);
}

export async function updateSchedule(id, data) {
  const index = mockSchedules.findIndex(s => s.id == id);
  if (index !== -1) {
    mockSchedules[index] = { ...mockSchedules[index], ...data };
    console.log("Mock API: Schedule updated:", mockSchedules[index]);
    return Promise.resolve(mockSchedules[index]);
  }
  return Promise.reject(new Error("Schedule not found"));
}

export async function deleteSchedule(id) {
  const initialLength = mockSchedules.length;
  mockSchedules = mockSchedules.filter(s => s.id != id);
  if (mockSchedules.length < initialLength) {
    console.log(`Mock API: Schedule ${id} deleted.`);
    return Promise.resolve(true);
  }
  return Promise.reject(new Error("Schedule not found"));
}

// ДОБАВЛЕНО: Mock функция для регистрации с email
export async function register(username, email, password) {
  console.log("Mock API: User registered:", { username, email });
  const token = "mock_jwt_token_" + Date.now();
  const user = { id: Date.now(), username, email, role: "USER", isBanned: false };
  return Promise.resolve({ token, user });
}

export async function login(username, password) {
  console.log("Mock API: User logged in:", username);
  const token = "mock_jwt_token_" + Date.now();
  const user = { id: 1, username, email: username + "@example.com", role: "USER", isBanned: false };
  return Promise.resolve({ token, user });
}

