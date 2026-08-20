import axiosInstance from "./axiosInstance";

export const getDashboardSummary = async () => {
  const response = await axiosInstance.get("/dashboard/summary");
  return response.data;
};

export const getRecentAlerts = async () => {
  const response = await axiosInstance.get("/dashboard/recent-alerts");
  return response.data;
};

export const getSimilarityStatistics = async () => {
  const response = await axiosInstance.get("/dashboard/similarity-statistics");
  return response.data;
};