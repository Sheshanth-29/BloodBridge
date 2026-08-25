import axios from "axios";

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In local dev it falls back to localhost so nothing breaks.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Automatically attach the login token to every request, if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bloodbridge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;