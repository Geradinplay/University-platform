const ApiClient = require("./apiClient");
const client = new ApiClient();

class SubjectService {
  static async getAll() {
    return client.get("/api/subjects");
  }

  static async create(dto) {
    return client.post("/api/subjects", dto);
  }

  static async delete(id) {
    return client.delete(`/api/subjects/${id}`);
  }
}

class ProfessorService {
  static async getAll() {
    return client.get("/api/professors");
  }

  static async create(dto) {
    return client.post("/api/professors", dto);
  }

  static async delete(id) {
    return client.delete(`/api/professors/${id}`);
  }
}

class ClassroomService {
  static async getAll() {
    return client.get("/api/classrooms");
  }

  static async create(dto) {
    return client.post("/api/classrooms", dto);
  }

  static async delete(id) {
    return client.delete(`/api/classrooms/${id}`);
  }
}

class ScheduleService {
  static async getAll() {
    return client.get("/schedule");
  }

  static async create(dto) {
    return client.post("/schedule", dto);
  }

  static async update(id, dto) {
    return client.put(`/schedule/${id}`, dto);
  }

  static async delete(id) {
    return client.delete(`/schedule/${id}`);
  }
}

class BreakService {
  static async getAll() {
    return client.get("/break");
  }

  static async create(dto) {
    return client.post("/break", dto);
  }

  static async delete(id) {
    return client.delete(`/break/${id}`);
  }
}

module.exports = {
  SubjectService,
  ProfessorService,
  ClassroomService,
  ScheduleService,
  BreakService,
};
