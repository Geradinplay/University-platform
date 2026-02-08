import { ApiClient } from "./apiClient";
import {
  Subject,
  Professor,
  Classroom,
  Lesson,
  Break,
  CreateSubjectDto,
  CreateProfessorDto,
  CreateClassroomDto,
  CreateLessonDto,
  UpdateLessonDto,
  CreateBreakDto,
} from "./models";

const client = new ApiClient();

export class SubjectService {
  static async getAll(): Promise<Subject[]> {
    return client.get<Subject[]>("/api/subjects");
  }

  static async create(dto: CreateSubjectDto): Promise<Subject> {
    return client.post<Subject>("/api/subjects", dto);
  }

  static async delete(id: number): Promise<void> {
    return client.delete(`/api/subjects/${id}`);
  }
}

export class ProfessorService {
  static async getAll(): Promise<Professor[]> {
    return client.get<Professor[]>("/api/professors");
  }

  static async create(dto: CreateProfessorDto): Promise<Professor> {
    return client.post<Professor>("/api/professors", dto);
  }

  static async delete(id: number): Promise<void> {
    return client.delete(`/api/professors/${id}`);
  }
}

export class ClassroomService {
  static async getAll(): Promise<Classroom[]> {
    return client.get<Classroom[]>("/api/classrooms");
  }

  static async create(dto: CreateClassroomDto): Promise<Classroom> {
    return client.post<Classroom>("/api/classrooms", dto);
  }

  static async delete(id: number): Promise<void> {
    return client.delete(`/api/classrooms/${id}`);
  }
}

export class ScheduleService {
  static async getAll(): Promise<Lesson[]> {
    return client.get<Lesson[]>("/schedule");
  }

  static async create(dto: CreateLessonDto): Promise<Lesson> {
    return client.post<Lesson>("/schedule", dto);
  }

  static async update(id: number, dto: UpdateLessonDto): Promise<Lesson> {
    return client.put<Lesson>(`/schedule/${id}`, dto);
  }

  static async delete(id: number): Promise<void> {
    return client.delete(`/schedule/${id}`);
  }
}

export class BreakService {
  static async getAll(): Promise<Break[]> {
    return client.get<Break[]>("/break");
  }

  static async create(dto: CreateBreakDto): Promise<Break> {
    return client.post<Break>("/break", dto);
  }

  static async delete(id: number): Promise<void> {
    return client.delete(`/break/${id}`);
  }
}
