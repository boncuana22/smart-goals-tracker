import api from './axios';

const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  uploadProfilePhoto: async (formData) => {
    const response = await api.post('/auth/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.user) {
      // Update the user in local storage
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, profilePhoto: response.data.user.profilePhoto };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  }
  
};

export default authService;