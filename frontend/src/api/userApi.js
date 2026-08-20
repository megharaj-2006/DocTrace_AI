import axiosInstance from "./axiosInstance";

export const getCurrentUser = async () => {
  const response = await axiosInstance.get("/users/me");
  return response.data;
};

export const updateCurrentUser = async (data) => {
  const response = await axiosInstance.put("/users/me", data);
  return response.data;
};