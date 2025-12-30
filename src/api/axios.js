import axios from "axios";
import Swal from "sweetalert2";

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

// 2. The "Global Guard" Interceptor (Refreshes Tokens OR Kicks Banned Users)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;

    // =========================================================
    // 🚨 CASE 1: HANDLE BANS & SUSPENSIONS (403 Forbidden)
    // =========================================================
    // The backend sends 403 when 'is_banned' is true.
    if (response && response.status === 403) {
       const msg = response.data?.message || "";
       
       // We check strictly for the ban messages we wrote in the backend
       if (msg.includes("Banned") || msg.includes("Suspended") || msg.includes("Account")) {
           // Freezing the screen with an alert they cannot close
           await Swal.fire({
             icon: "error",
             title: "Access Denied",
             text: response.data.reason || "Your account has been suspended due to a violation of our terms.",
             confirmButtonColor: "#d33",
             confirmButtonText: "Log Out",
             allowOutsideClick: false,
             allowEscapeKey: false
           });

           // Force Logout immediately after they click
           localStorage.clear();
           sessionStorage.clear();
           window.location.href = "/login?sessionExpired=true";
           return Promise.reject(error);
       }
    }

    // =========================================================
    // 🔄 CASE 2: TOKEN EXPIRED (401 Unauthorized) -> TRY REFRESH
    // =========================================================
    if (response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        console.log("🔄 Token expired. Attempting to refresh...");
        
        // Call backend refresh endpoint
        const res = await client.post("/api/auth/refresh");
        const newAccessToken = res.data.accessToken;

        if (newAccessToken) {
          console.log("✅ Token refreshed!");
          
          // 1. Save new token
          localStorage.setItem("accessToken", newAccessToken);
          
          // 2. Update default headers for future requests
          client.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          
          // 3. Update the *failed* request's headers and retry it
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Session expired or User Deleted. Logging out.");
        
        // If Refresh Fails (or User was Deleted from DB), we must log them out
        localStorage.clear();
        sessionStorage.clear();
        
        // Only redirect if we aren't already on the login page (prevents loops)
        if (window.location.pathname !== "/login") {
            window.location.href = "/login?sessionExpired=true";
        }
        
        return Promise.reject(refreshError);
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