import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css'; 
import TrackSMARTLogo from '../../assets/TrackSMARTLogo.svg';

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="modern-layout">
      {/* Sidebar */}
      <div className={`modern-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <img src={TrackSMARTLogo} alt="TrackSMART Logo" style={{ width: '100%', maxWidth: 120 }} />
        </div>
        <nav className="sidebar-nav">
          <ul className="nav-items">
            <li className="nav-item">
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-chart-bar"></i>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/tasks"
                className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-tasks"></i>
                <span className="nav-text">Tasks</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/goals"
                className={`nav-link ${location.pathname === '/goals' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-bullseye"></i>
                <span className="nav-text">SMART Goals</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/financial"
                className={`nav-link ${location.pathname === '/financial' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-chart-line"></i>
                <span className="nav-text">Financial</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/calendar"
                className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-calendar"></i>
                <span className="nav-text">Calendar</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/profile"
                className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-user"></i>
                <span className="nav-text">Profile</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/teams"
                className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}
              >
                <i className="nav-icon fas fa-users"></i>
                <span className="nav-text">Teams</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="nav-icon fas fa-sign-out-alt"></i>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="modern-content">
        <header className="modern-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fas fa-bars"></i>
          </button>
        </header>
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;