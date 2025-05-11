import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importarea paginilor
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import Calendar from './pages/Calendar';
import Financial from './pages/Financial';
import NotFound from './pages/NotFound';
import GoalDetails from './pages/GoalDetails';
import UserProfile from './pages/UserProfile';
import Teams from './pages/Teams';
import TeamDetails from './pages/TeamDetails';

// Route Guard pentru rute protejate
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Route Guard pentru rute publice (accesibile doar când utilizatorul nu este autentificat)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
};

// Configurația rutelor
const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    )
  },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    )
  },
  {
    path: '/tasks',
    element: (
      <PrivateRoute>
        <Tasks />
      </PrivateRoute>
    )
  },
  {
    path: '/goals',
    element: (
      <PrivateRoute>
        <Goals />
      </PrivateRoute>
    )
  },
  {
    path: '/calendar',
    element: (
      <PrivateRoute>
        <Calendar />
      </PrivateRoute>
    )
  },
  {
    path: '/financial',
    element: (
      <PrivateRoute>
        <Financial />
      </PrivateRoute>
    )
  },
  {
    path: '*',
    element: <NotFound />
  },
  {
    path: '/goals/:id',
    element: (
      <PrivateRoute>
        <GoalDetails />
      </PrivateRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <UserProfile />
      </PrivateRoute>
    )
  },
  {
    path: '/teams',
    element: (
      <PrivateRoute>
        <Teams />
      </PrivateRoute>
    )
  },
  {
    path: '/teams/:id',
    element: (
      <PrivateRoute>
        <TeamDetails />
      </PrivateRoute>
    )
  }
];

export default routes;