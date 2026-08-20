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

export const getProviderInvoices = async (id, page = 0, size = 10) => {
  const response = await axiosInstance.get(`/providers/${id}/invoices`, {
    params: { page, size },
  });
  return response.data;
};

export const createProvider = async (data) => {
  const response = await axiosInstance.post("/providers", data);
  return response.data;
};

export const updateProvider = async (id, data) => {
  const response = await axiosInstance.put(`/providers/${id}`, data);
  return response.data;
};