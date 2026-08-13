import axios from "axios";

// This is where your backend will run during development.
// We'll build this backend in the next major step.
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach the login token to every request, if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bloodbridge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;