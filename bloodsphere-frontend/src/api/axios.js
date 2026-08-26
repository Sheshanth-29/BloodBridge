import axios from "axios";

// VITE_API_URL can be overridden locally via .env.local (never committed).
// The hardcoded Render URL is the safe fallback for every deployed build.
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://bloodbridge-backend-rzf7.onrender.com/api",
});

// Automatically attach the login token to every request, if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bloodbridge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;