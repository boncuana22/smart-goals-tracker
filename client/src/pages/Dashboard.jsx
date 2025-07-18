import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import taskService from '../api/taskService';
import goalService from '../api/goalService';
import financialService from '../api/financialService';
import './Dashboard.css';
import { calculateGoalProgress } from '../utils/progressUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    tasks: {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0
    },
    goals: {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      onHold: 0
    },
    financial: {
      recentUploads: [],
      keyMetrics: []
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Încărcare task-uri
      const tasksData = await taskService.getAllTasks();
      const tasks = tasksData.tasks || [];
      
      // Încărcare obiective
      const goalsData = await goalService.getAllGoals();
      const goals = goalsData.goals || [];
      
      // Încărcare date financiare recente
      const financialData = await financialService.getAllFinancialData();
      const financialRecords = financialData.financialData || [];
      
      // Calculare metrici pentru dashboard
      const taskSummary = {
        total: tasks.length,
        completed: tasks.filter(task => task.status === 'Completed').length,
        inProgress: tasks.filter(task => task.status === 'In Progress').length,
        todo: tasks.filter(task => task.status === 'To Do').length
      };
      
      // Calculare metrici pentru obiective bazate pe progres real
      const goalSummary = {
        total: goals.length,
        onTrack: 0,
        needsAttention: 0,
        completed: 0,
        overdue: 0
      };
      
      goals.forEach(goal => {
        // Calculează progresul real al obiectivului
        let actualProgress = 0;
        
        // Dacă obiectivul are KPIs, calculează progresul din KPIs
        if (goal.kpis && goal.kpis.length > 0) {
          const kpiProgress = goal.kpis.reduce((sum, kpi) => {
            if (kpi.target_value && kpi.target_value > 0) {
              return sum + (kpi.current_value / kpi.target_value) * (kpi.weight_in_goal || 1);
            }
            return sum;
          }, 0);
          actualProgress = kpiProgress / goal.kpis.length;
        }
        // Altfel, dacă obiectivul are task-uri, calculează din task-uri
        else if (goal.tasks && goal.tasks.length > 0) {
          const completedTasks = goal.tasks.filter(task => task.status === 'Completed').length;
          actualProgress = completedTasks / goal.tasks.length;
        }
        
        // Verifică dacă obiectivul este overdue
        const isOverdue = goal.time_bound_date && new Date(goal.time_bound_date) < new Date() && actualProgress < 1;
        
        // Categorizează obiectivul bazat pe progresul real și deadline
        if (actualProgress >= 1) {
          goalSummary.completed++;
        } else if (isOverdue) {
          goalSummary.overdue++;
        } else if (actualProgress >= 0.5) {
          goalSummary.onTrack++;
        } else {
          goalSummary.needsAttention++;
        }
      });
      
      // Obține cele mai recente 3 încărcări financiare
      const recentUploads = financialRecords
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      // Extrage metrici financiare cheie
      const keyMetrics = extractKeyFinancialMetrics(financialRecords);
      
      setDashboardData({
        tasks: taskSummary,
        goals: {
          ...goalSummary,
          goals: goals // Include the actual goals array
        },
        financial: {
          recentUploads,
          keyMetrics
        }
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funcție pentru extragerea metricilor financiare cheie
  const extractKeyFinancialMetrics = (financialRecords) => {
    if (!financialRecords || financialRecords.length === 0) {
      return [];
    }
    
    // Găsește cele mai recente înregistrări pentru fiecare tip de date financiare
    const recordsByType = {};
    
    financialRecords.forEach(record => {
      const type = record.data_type;
      if (!recordsByType[type] || 
          new Date(record.data_period) > new Date(recordsByType[type].data_period)) {
        recordsByType[type] = record;
      }
    });
    
    // Extrage metricile cheie (Revenue, Gross Margin, Net Profit)
    const keyMetricNames = ['Revenue', 'Gross Margin', 'Net Profit'];
    const keyMetrics = [];
    
    Object.values(recordsByType).forEach(record => {
      if (record.metrics && record.metrics.length > 0) {
        record.metrics.forEach(metric => {
          if (keyMetricNames.includes(metric.metric_name)) {
            keyMetrics.push({
              ...metric,
              data_period: record.data_period,
              data_type: record.data_type
            });
          }
        });
      }
    });
    
    return keyMetrics;
  };

  // Format date pentru afișare
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };
  
  // Format currency
  
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
  
    // Asigură-te că value este un număr
    const numValue = Number(value);
    if (isNaN(numValue)) return 'Invalid amount';
  
    if (Math.abs(numValue) >= 1000000) {
      return `$${(numValue / 1000000).toFixed(2)}M`;
    } else if (Math.abs(numValue) >= 1000) {
      return `$${(numValue / 1000).toFixed(2)}K`;
    } else {
      return `$${numValue.toFixed(2)}`;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading dashboard data...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard-container">
        <h2>Dashboard</h2>
        
        <div className="dashboard-grid">
          {/* Task Summary */}
          <div className="dashboard-card task-summary">
            <div className="card-header">
              <h3>Task Summary</h3>
              <button 
                className="btn-link"
                onClick={() => navigate('/tasks')}
              >
                View All
              </button>
            </div>
            <div className="task-stats">
              <div className="stat-item">
                <div className="stat-value">{dashboardData.tasks.total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dashboardData.tasks.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dashboardData.tasks.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{dashboardData.tasks.todo}</div>
                <div className="stat-label">To Do</div>
              </div>
            </div>
            {dashboardData.tasks.total === 0 ? (
              <div className="empty-message">
                <p>No tasks created yet.</p>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/tasks')}
                >
                  Create Task
                </button>
              </div>
            ) : (
              <div className="progress-summary">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${dashboardData.tasks.total > 0 
                        ? (dashboardData.tasks.completed / dashboardData.tasks.total) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {dashboardData.tasks.total > 0 
                    ? `${Math.round((dashboardData.tasks.completed / dashboardData.tasks.total) * 100)}% Completed` 
                    : '0% Completed'}
                </div>
              </div>
            )}
          </div>
          
          {/* Goal Summary */}
          <div className="dashboard-card goal-summary">
            <div className="card-header">
              <h3>Goals Overview</h3>
              <button 
                className="btn-link"
                onClick={() => navigate('/goals')}
              >
                View All
              </button>
            </div>
            
            {dashboardData.goals.total === 0 ? (
              <div className="empty-message">
                <p>No SMART goals created yet.</p>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/goals')}
                >
                  Create Goal
                </button>
              </div>
            ) : (
              <div className="goals-list">
                {(dashboardData.goals.goals || []).slice(0, 5).map(goal => {
                  const progressPercent = calculateGoalProgress(goal);
                  
                  return (
                    <div key={goal.id} className="goal-item">
                    <div className="goal-title">{goal.title}</div>
                    <div className="goal-progress-bar">
                      <div 
                        className="goal-progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="goal-progress-text">{progressPercent}%</div>
                  </div>
                  );
                })}
                {(dashboardData.goals.goals || []).length > 5 && (
                  <div className="more-goals">
                    <button 
                      className="btn-link"
                      onClick={() => navigate('/goals')}
                    >
                      View {(dashboardData.goals.goals || []).length - 5} more goals...
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Financial Overview */}
          <div className="dashboard-card financial-overview">
            <div className="card-header">
              <h3>Financial Overview</h3>
              <button 
                className="btn-link"
                onClick={() => navigate('/financial')}
              >
                View All
              </button>
            </div>
            
            {dashboardData.financial.keyMetrics.length === 0 ? (
              <div className="empty-message">
                <p>No financial data uploaded yet.</p>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/financial')}
                >
                  Upload Financial Data
                </button>
              </div>
            ) : (
              <>
                <div className="key-metrics metric-list">
                  {dashboardData.financial.keyMetrics.map((metric, index) => (
                    <div key={index} className="metric-list-item">
                      <div className="metric-header">
                        <div className="metric-name">{metric.metric_name}</div>
                        <div className="metric-period">{formatDate(metric.data_period)}</div>
                      </div>
                      <div className="metric-value">{formatCurrency(metric.current_value)}</div>
                      {metric.percentage_change !== null && (
                        <div className={`metric-change ${metric.percentage_change >= 0 ? 'positive' : 'negative'}`}>
                          {metric.percentage_change >= 0 ? '▲' : '▼'} 
                          {Math.abs(metric.percentage_change).toFixed(2)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="recent-uploads">
                  <h4>Recent Uploads</h4>
                  <ul className="uploads-list">
                    {dashboardData.financial.recentUploads.map((upload, index) => (
                      <li key={index} className="upload-item">
                        <div className="upload-type">{upload.data_type}</div>
                        <div className="upload-date">{formatDate(upload.data_period)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;