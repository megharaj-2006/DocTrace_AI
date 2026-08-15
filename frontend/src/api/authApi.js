import axiosInstance from "./axiosInstance";

export const loginApi = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const registerApi = async (email, password, fullName) => {
  const response = await axiosInstance.post("/auth/register", {
    email,
    password,
    fullName,
  });
  return response.data;
};