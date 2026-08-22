const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

/**
 * Core HTTP request handler
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    ...(options.headers || {}),
  };

  const token = localStorage.getItem("token");
  if (token && !headers["Authorization"] && !headers["authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const netError = new Error(
        "Unable to connect to backend server. Please verify the server is running."
      );
      netError.status = 0;
      throw netError;
    }
    throw error;
  }
}

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
export const authApi = {
  register: (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getMe: () =>
    request("/auth/me", {
      method: "GET",
    }),

  updateProfile: (profileData) =>
    request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),
};

// ----------------------------------------------------
// Dashboard API
// ----------------------------------------------------
export const dashboardApi = {
  getAdminDashboard: () =>
    request("/dashboard/admin", {
      method: "GET",
    }),
};

// ----------------------------------------------------
// Attendance API
// ----------------------------------------------------
export const attendanceApi = {
  checkIn: () =>
    request("/attendance/check-in", {
      method: "POST",
    }),

  checkOut: () =>
    request("/attendance/check-out", {
      method: "POST",
    }),

  getAttendance: (status = "") => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/attendance${query}`, {
      method: "GET",
    });
  },
};

// ----------------------------------------------------
// Leave API
// ----------------------------------------------------
export const leaveApi = {
  applyLeave: (leaveData) =>
    request("/leave", {
      method: "POST",
      body: JSON.stringify(leaveData),
    }),

  getLeaves: () =>
    request("/leave", {
      method: "GET",
    }),

  updateLeave: (id, { status, adminComment }) =>
    request(`/leave/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminComment }),
    }),
};

// ----------------------------------------------------
// Health Check API
// ----------------------------------------------------
export const healthApi = {
  checkHealth: () =>
    request("/health", {
      method: "GET",
    }),
};

export default {
  auth: authApi,
  dashboard: dashboardApi,
  attendance: attendanceApi,
  leave: leaveApi,
  health: healthApi,
};
