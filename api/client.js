const BASE_URL = "http://localhost:8080";

class ApiClient {
  async get(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`GET ${endpoint}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async post(endpoint, body) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`POST ${endpoint}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async put(endpoint, body) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`PUT ${endpoint}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async patch(endpoint, body) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`PATCH ${endpoint}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async delete(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`DELETE ${endpoint}: ${response.status} ${response.statusText}`);
    }
  }
}

const apiClient = new ApiClient();
