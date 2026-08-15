import axiosInstance from "./axiosInstance";

export const getProviders = async (page = 0, size = 10) => {
  const response = await axiosInstance.get("/providers", {
    params: { page, size },
  });
  return response.data;
};

export const getProviderById = async (id) => {
  const response = await axiosInstance.get(`/providers/${id}`);
  return response.data;
};