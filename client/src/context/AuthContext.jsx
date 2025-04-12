import React, { createContext, useState, useEffect } from 'react';
import authService from '../api/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificăm dacă utilizatorul este autentificat la încărcarea aplicației
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          // Opțional: Verificăm validitatea token-ului cu backend-ul
          const response = await authService.getProfile();
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.logout(); // Curățăm datele de autentificare dacă token-ul nu mai este valid
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Funcții pentru autentificare
  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook pentru acces mai ușor la context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};