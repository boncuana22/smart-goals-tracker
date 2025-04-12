import React from 'react';
import Layout from '../components/common/Layout';

const Dashboard = () => {
  return (
    <Layout>
      <div className="dashboard">
        <h2>Dashboard</h2>
        <p>Welcome to your SMART Goals Dashboard. Here you can monitor your tasks, goals, and financial metrics.</p>
        
        <div className="dashboard-summary">
          <div className="summary-card">
            <h3>Tasks</h3>
            <p>You have 0 tasks in progress</p>
          </div>
          
          <div className="summary-card">
            <h3>Goals</h3>
            <p>You have 0 active goals</p>
          </div>
          
          <div className="summary-card">
            <h3>Financial KPIs</h3>
            <p>No financial data available yet</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;