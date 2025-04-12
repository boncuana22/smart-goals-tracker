import axios from 'axios';

// Creăm o instanță Axios cu configurări comune
const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pentru a adăuga token-ul JWT la fiecare cerere
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pentru a gestiona erorile comune
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Autologout dacă primim 401 Unauthorized
      if (error.response.status === 401 && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;