import api from './axios';

const kpiService = {
  getAllKPIs: async () => {
    const response = await api.get('/kpis');
    return response.data;
  },

  getKPIById: async (id) => {
    const response = await api.get(`/kpis/${id}`);
    return response.data;
  },

  createKPI: async (kpiData) => {
    const response = await api.post('/kpis', kpiData);
    return response.data;
  },

  updateKPI: async (id, kpiData) => {
    const response = await api.put(`/kpis/${id}`, kpiData);
    return response.data;
  },

  deleteKPI: async (id) => {
    const response = await api.delete(`/kpis/${id}`);
    return response.data;
  },

  updateKPIValue: async (id, valueObj) => {
    const response = await api.patch(`/kpis/${id}/value`, valueObj);
    return response.data;
  },
  
  // New function to sync financial KPIs with latest financial data
  syncFinancialKPIs: async () => {
    const response = await api.post('/kpis/sync-financial');
    return response.data;
  }
};

export default kpiService;