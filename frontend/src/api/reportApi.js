import axiosInstance from "./axiosInstance";

export const getReportSummary = async () => {
  const response = await axiosInstance.get("/reports/summary");
  return response.data;
};
