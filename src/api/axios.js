// src/api/axios.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ Allow cookies (refresh token)
});

// ✅ Attach Authorization header automatically if token exists
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============== AUTO REFRESH & RETRY FAILED REQUESTS ===============
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry
    ) {
      original._retry = true;

      try {
        const res = await client.post("/api/auth/refresh", {}, { withCredentials: true });

        const newToken = res.data?.accessToken;
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          client.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          original.headers["Authorization"] = `Bearer ${newToken}`;
        }

        return client(original);
      } catch (err) {
        console.log("Auto refresh failed.");
      }
    }

    return Promise.reject(error);
  }
);


// ✅ Manual update for newly received tokens
export const attachToken = (token) => {
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
};

export default client;


