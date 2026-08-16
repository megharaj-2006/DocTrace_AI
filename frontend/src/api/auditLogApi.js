import axiosInstance from "./axiosInstance";

export const getAuditLogs = async (page = 0, size = 50) => {
  const response = await axiosInstance.get("/admin/audit-logs", {
    params: { page, size, sort: "createdAt,desc" },
  });
  return response.data;
};
