import axiosInstance from "./axiosInstance";

export const getInvoices = async (page = 0, size = 10) => {
  const response = await axiosInstance.get("/invoices", {
    params: { page, size },
  });
  return response.data;
};

export const getInvoiceById = async (id) => {
  const response = await axiosInstance.get(`/invoices/${id}`);
  return response.data;
};

export const uploadInvoice = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post("/invoices", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const analyzeInvoice = async (id) => {
  const response = await axiosInstance.post(`/invoices/${id}/analyze`);
  return response.data;
};

export const getInvoiceAnalysis = async (id) => {
  const response = await axiosInstance.get(`/invoices/${id}/analysis`);
  return response.data;
};

export const getAnalysisHistory = async (id) => {
  const response = await axiosInstance.get(`/invoices/${id}/analysis/history`);
  return response.data;
};

export const getSimilarInvoices = async (id) => {
  const response = await axiosInstance.get(`/invoices/${id}/similar`);
  return response.data;
};

export const getAnalyses = async () => {
  const response = await axiosInstance.get("/analysis");
  return response.data;
};
