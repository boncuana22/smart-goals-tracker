import api from './axios';

const financialService = {
  // Obținerea tuturor datelor financiare
  getAllFinancialData: async () => {
    const response = await api.get('/financial');
    return response.data;
  },

  // Obținerea unei înregistrări financiare după ID
  getFinancialDataById: async (id) => {
    const response = await api.get(`/financial/${id}`);
    return response.data;
  },

  // Încărcarea unui fișier financiar
  uploadFinancialData: async (formData) => {
    const response = await api.post('/financial/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Ștergerea unei înregistrări financiare
  deleteFinancialData: async (id) => {
    const response = await api.delete(`/financial/${id}`);
    return response.data;
  },

  // Get all available financial metrics for the user
  getAllFinancialMetrics: async () => {
    const response = await api.get('/financial/metrics');
    return response.data;
  }
};

export default financialService;