export interface Subject {
  id: number;
  name: string;
}

export interface Professor {
  id: number;
  name: string;
}

export interface Classroom {
  id: number;
  number: string;
}

export interface Break {
  id: number;
  startTime: string;
  endTime: string;
  day: number;
}

export interface Lesson {
  id: number;
  startTime: string;
  endTime: string;
  day: number;
  subject: Subject;
  professor: Professor;
  classroom: Classroom;
  breakInfo: Break | null;
}

export interface CreateSubjectDto {
  name: string;
}

export interface CreateProfessorDto {
  name: string;
}

export interface CreateClassroomDto {
  number: string;
}

export interface CreateLessonDto {
  startTime: string;
  endTime: string;
  day: number;
  subjectId: number;
  professorId: number;
  classroomId: number;
}

export interface UpdateLessonDto {
  startTime?: string;
  endTime?: string;
  day?: number;
  subjectId?: number;
  professorId?: number;
  classroomId?: number;
}

export interface CreateBreakDto {
  startTime: string;
  endTime: string;
  day: number;
}
