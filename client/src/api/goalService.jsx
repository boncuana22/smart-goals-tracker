import api from './axios';

const goalService = {
  getAllGoals: async () => {
    const response = await api.get('/goals');
    return response.data;
  },

  getGoalById: async (id) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  updateGoal: async (id, goalData) => {
    const response = await api.put(`/goals/${id}`, goalData);
    return response.data;
  },

  deleteGoal: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  updateGoalProgress: async (id, progress, status) => {
    const response = await api.patch(`/goals/${id}/progress`, { progress, status });
    return response.data;
  }
};

export default goalService;