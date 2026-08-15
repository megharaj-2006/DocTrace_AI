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