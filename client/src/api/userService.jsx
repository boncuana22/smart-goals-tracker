import api from './axios';

const userService = {
  // Obține toți utilizatorii
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  // Obține un utilizator specific
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  }
};

export default userService;