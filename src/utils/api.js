// src/utils/api.js
export async function apiRequest(path, method = "GET", body = null, isFormData = false) {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  let accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  // -------------------------------
  // 🧱 1. Base Headers
  // -------------------------------
  const baseHeaders = {};
  if (!isFormData) baseHeaders["Content-Type"] = "application/json";

  // -------------------------------
  // ⚙️ 2. Helper: Send Request
  // -------------------------------
  async function sendRequest(token) {
    const headers = { ...baseHeaders };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = { method: method.toUpperCase(), headers };

    if (!["GET", "HEAD"].includes(method.toUpperCase())) {
      if (isFormData && body) {
        options.body = body;
      } else if (body) {
        options.body = JSON.stringify(body);
      }
    }

    try {
      return await fetch(`${API_BASE}${path}`, options);
    } catch (err) {
      console.error("🌐 Network request failed:", err);
      throw new Error("Network error. Please check your connection.");
    }
  }

  // -------------------------------
  // 🔑 3. First Attempt
  // -------------------------------
  let res = await sendRequest(accessToken);

  // -------------------------------
  // ♻️ 4. Handle 401 / 403 (token expired)
  // -------------------------------
  if (res.status === 401 || res.status === 403) {
    console.warn("⚠️ Access token expired — attempting refresh...");

    if (!refreshToken) {
      console.warn("❌ No refresh token — redirecting to login.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!refreshRes.ok) throw new Error("Token refresh failed");

      const refreshData = await refreshRes.json();
      if (!refreshData.accessToken) throw new Error("No access token returned from refresh");

      // Save new token and retry original request
      localStorage.setItem("accessToken", refreshData.accessToken);
      accessToken = refreshData.accessToken;
      res = await sendRequest(accessToken);
    } catch (err) {
      console.error("🔒 Token refresh failed:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  // -------------------------------
  // 🚨 5. Handle non-OK responses
  // -------------------------------
  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.message) errorMessage = data.message;
      else if (data.error) errorMessage = data.error;
      else if (data.detail) errorMessage = data.detail;
    } catch {
      const text = await res.text().catch(() => null);
      if (text) errorMessage = text;
    }
    console.error("❌ API Error:", errorMessage);
    throw new Error(errorMessage);
  }

  // -------------------------------
  // 📦 6. Parse Response
  // -------------------------------
  if (res.status === 204) return null; // No Content

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  } else {
    return await res.text();
  }
}
