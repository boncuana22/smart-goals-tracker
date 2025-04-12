import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1>SMART Goals Tracker</h1>
        </div>
        <div className="header-right">
          {user && (
            <div className="user-info">
              <span>Welcome, {user.username}</span>
              <button onClick={handleLogout} className="btn btn-outline-light">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <nav className="sidebar-nav">
              <ul className="nav flex-column">
                <li className="nav-item">
                  <Link
                    to="/dashboard"
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/tasks"
                    className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}
                  >
                    Tasks
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/goals"
                    className={`nav-link ${location.pathname === '/goals' ? 'active' : ''}`}
                  >
                    SMART Goals
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/financial"
                    className={`nav-link ${location.pathname === '/financial' ? 'active' : ''}`}
                  >
                    Financial Data
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/calendar"
                    className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
                  >
                    Calendar
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;