import axiosInstance from "./axiosInstance";

export const getAlerts = async (page = 0, size = 10, riskLevel = null, status = null) => {
  const params = { page, size };
  if (riskLevel) params.riskLevel = riskLevel;
  if (status) params.status = status;
  const response = await axiosInstance.get("/alerts", { params });
  return response.data;
};

export const getAlertById = async (id) => {
  const response = await axiosInstance.get(`/alerts/${id}`);
  return response.data;
};

export const assignAlert = async (id) => {
  const response = await axiosInstance.post(`/alerts/${id}/assign`);
  return response.data;
};

export const updateAlertStatus = async (id, status, notes = "") => {
  const response = await axiosInstance.patch(`/alerts/${id}/status`, {
    status,
    notes,
  });
  return response.data;
};

export const resolveAlert = async (id, resolutionNotes = "") => {
  const resolution = typeof resolutionNotes === "object" 
    ? (resolutionNotes.resolution || resolutionNotes.resolutionNotes || "") 
    : resolutionNotes;
  const response = await axiosInstance.post(`/alerts/${id}/resolve`, {
    resolution: resolution || "Claim verified and resolved by investigator.",
  });
  return response.data;
};

export const dismissAlert = async (id, reason = "") => {
  const reasonText = typeof reason === "object" 
    ? (reason.reason || "") 
    : reason;
  const response = await axiosInstance.post(`/alerts/${id}/dismiss`, {
    reason: reasonText || "False positive template similarity.",
  });
  return response.data;
};