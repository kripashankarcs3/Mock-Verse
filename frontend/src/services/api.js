import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  // Production (Vercel): same origin, `/api/*` is rewritten to the backend service.
  // Dev: talk to the local Express server directly.
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:5001" : ""),
  // Generous: a single Judge0 run can take a while on the free API.
  timeout: 45_000,
});

// Attach the Firebase ID token so protected backend routes work.
api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.warn("Could not read auth token:", error?.message);
    }
  }
  return config;
});

export async function runCode(payload) {
  const response = await api.post("/api/execution/run-code", payload);
  return response.data;
}

export async function submitCodeToJudge(payload) {
  const response = await api.post("/api/execution/submit-code", payload);
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

export async function createOrUpdateUser({ name, email }) {
  const response = await api.post("/api/users", { name, email });
  return response.data;
}

export default api;
