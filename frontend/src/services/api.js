import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
});

export async function runCode(payload) {
  const response = await api.post("/run", payload);
  return response.data;
}

// ── Problem APIs ─────────────────────────────────────────────────────────────

export async function createProblem(problemData) {
  const response = await api.post("/api/problems", problemData);
  return response.data;
}

export async function getPublicProblems() {
  const response = await api.get("/api/problems");
  return response.data;
}

export async function getUserProblems(firebaseUID) {
  const response = await api.get(`/api/problems/user/${firebaseUID}`);
  return response.data;
}

export async function updateProblem(id, updates) {
  const response = await api.put(`/api/problems/${id}`, updates);
  return response.data;
}

export async function deleteProblem(id) {
  const response = await api.delete(`/api/problems/${id}`);
  return response.data;
}
