class ScheduleService {
  static async getAll() {
    return apiClient.get("/schedule");
  }

  static async create(dto) {
    return apiClient.post("/schedule", dto);
  }

  static async update(id, dto) {
    return apiClient.put(`/schedule/${id}`, dto);
  }

  static async delete(id) {
    return apiClient.delete(`/schedule/${id}`);
  }
}
