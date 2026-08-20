import axiosInstance from "./axiosInstance";

export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/users/me");
  return response.data;
};

export const updateCurrentUser = async (data) => {
  const response = await axiosInstance.put("/users/me", data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await axiosInstance.post("/users/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getAdminUsers = async (page = 0, size = 20) => {
  const response = await axiosInstance.get("/admin/users", {
    params: { page, size },
  });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/role`, null, {
    params: { role },
  });
  return response.data;
};