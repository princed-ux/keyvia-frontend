import axios from "axios";
import Swal from "sweetalert2";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, 
});

let isRefreshing = false;
let failedQueue = [];

// ✅ Helper to safely set headers (Fixes Axios v1.x+ issues)
const setAuthHeader = (config, token) => {
  if (config.headers && config.headers.set) {
    // Axios v1.x+ style
    config.headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Legacy style
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// =========================================================
// 1. REQUEST INTERCEPTOR
// =========================================================
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAuthHeader(config, token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// 2. RESPONSE INTERCEPTOR
// =========================================================
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ⛔ Prevent infinite loops on auth routes
    if (originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // ⛔ CASE 1: Banned/Suspended (403)
    if (error.response?.status === 403) {
       const msg = error.response.data?.message || "";
       if (msg.includes("Banned") || msg.includes("Suspended")) {
           await Swal.fire({
             icon: "error",
             title: "Access Denied",
             text: error.response.data.reason || "Your account has been suspended.",
             confirmButtonColor: "#d33",
             confirmButtonText: "Log Out",
             allowOutsideClick: false
           });
           localStorage.clear();
           window.location.href = "/login?sessionExpired=true";
           return Promise.reject(error);
       }
    }

    // 🔄 CASE 2: Token Expired (401) -> Try Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        // Queue concurrent requests while refreshing
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // ✅ FIX: Apply new token to queued requests using helper
            setAuthHeader(originalRequest, token);
            return client(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Refreshing token...");
        
        const res = await client.post("/api/auth/refresh");
        const newAccessToken = res.data.accessToken;

        if (newAccessToken) {
          console.log("✅ Token refreshed successfully!");
          
          localStorage.setItem("accessToken", newAccessToken);
          
          // Update defaults for future requests
          setAuthHeader(client.defaults, newAccessToken);
          
          // ✅ FIX: Apply new token to THIS failed request
          setAuthHeader(originalRequest, newAccessToken);

          // Process queue
          processQueue(null, newAccessToken);

          // Retry original
          return client(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Session expired. Logging out.");
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = "/login?sessionExpired=true";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const attachToken = (token) => {
  if (token) {
    setAuthHeader(client.defaults, token);
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
};

export default client;