import axios from "axios";
import useAuthStore from "../store/authStore";

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (typeof window !== "undefined") {
    // On HTTPS deployments (Vercel, Netlify, custom domain), direct HTTP IP calls are blocked by browser Mixed Content policy.
    // Use relative path so vercel.json / netlify.toml / reverse proxy securely forwards to backend.
    if (window.location.protocol === "https:") {
      if (envUrl && envUrl.startsWith("https://")) {
        return envUrl.trim();
      }
      return "/api/v1";
    }

    // On localhost dev/preview or reverse proxy
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "/api/v1";
    }
  }

  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim();
  }

  return "/api/v1";
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto logout on 401 (only for authenticated session requests, not auth endpoints)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint && window.location.pathname !== "/login") {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;