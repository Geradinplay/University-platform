class SubjectService {
  static async getAll() {
    return apiClient.get("/api/subjects");
  }

  static async create(dto) {
    return apiClient.post("/api/subjects", dto);
  }

  static async delete(id) {
    return apiClient.delete(`/api/subjects/${id}`);
  }
}

class ProfessorService {
  static async getAll() {
    return apiClient.get("/api/professors");
  }

  static async create(dto) {
    return apiClient.post("/api/professors", dto);
  }

  static async delete(id) {
    return apiClient.delete(`/api/professors/${id}`);
  }
}

class ClassroomService {
  static async getAll() {
    return apiClient.get("/api/classrooms");
  }

  static async create(dto) {
    return apiClient.post("/api/classrooms", dto);
  }

  static async delete(id) {
    return apiClient.delete(`/api/classrooms/${id}`);
  }
}

class ScheduleService {
  static async getAll() {
    return apiClient.get("/api/schedule");
  }

  static async create(dto) {
    return apiClient.post("/api/schedule", dto);
  }

  static async update(id, dto) {
    return apiClient.put(`/api/schedule/${id}`, dto);
  }

  static async delete(id) {
    return apiClient.delete(`/api/schedule/${id}`);
  }
}

class BreakService {
  static async getAll() {
    return apiClient.get("/break");
  }

  static async create(dto) {
    return apiClient.post("/break", dto);
  }

  static async delete(id) {
    return apiClient.delete(`/break/${id}`);
  }
}
