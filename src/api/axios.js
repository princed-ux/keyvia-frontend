import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Allows cookies (for refresh tokens)
});

// 1. Automatically add the Access Token to every request
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Smart Error Handling (Auto-Refresh or Force Logout)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried so we don't loop forever

      try {
        console.log("🔄 Token expired. Attempting to refresh...");
        
        // Call your backend refresh endpoint
        const res = await client.post("/api/auth/refresh");
        const newAccessToken = res.data.accessToken;

        if (newAccessToken) {
          console.log("✅ Token refreshed!");
          
          // 1. Save new token
          localStorage.setItem("accessToken", newAccessToken);
          
          // 2. Update default headers
          client.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // 3. Retry the original failed request
          return client(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Session expired. Logging out.");
        
        // Refresh failed -> Clear storage & Force Logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        
        // ✅ UPDATED: Redirect with a flag so we can notify the user
        window.location.href = "/login?sessionExpired=true";
      }
    }

    return Promise.reject(error);
  }
);

export const attachToken = (token) => {
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
};

export default client;