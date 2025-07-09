import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import GoalDetail from '../components/goals/GoalDetail';
import goalService from '../api/goalService';
import kpiService from '../api/kpiService';
import taskService from '../api/taskService';
import './GoalDetails.css';

const GoalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadGoalData(id);
    }
  }, [id]);

  const loadGoalData = async (goalId) => {
    setIsLoading(true);
    setError('');
    try {
      // Load goal data
      const response = await goalService.getGoalById(goalId);
      if (!response.goal) {
        throw new Error('Goal not found');
      }
      
      setGoal(response.goal);
      
      // Load related tasks
      try {
        const tasksResponse = await taskService.getAllTasks();
        const filtered = tasksResponse.tasks.filter(task => task.goal_id === parseInt(goalId));
        setRelatedTasks(filtered);
      } catch (err) {
        console.error('Error loading related tasks:', err);
      }
    } catch (err) {
      console.error('Error loading goal:', err);
      setError('Failed to load goal details. The goal may not exist or there was a connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/goals');
  };

  const handleAddKPI = async (kpiData) => {
    try {
      const data = { ...kpiData, goal_id: id };
      const response = await kpiService.createKPI(data);
      
      // Update state
      setGoal({
        ...goal,
        kpis: [...(goal.kpis || []), response.kpi]
      });
    } catch (err) {
      console.error('Error adding KPI:', err);
      alert('Failed to add KPI. Please try again.');
    }
  };

  const handleEditKPI = async (kpiId, kpiData) => {
    try {
      const response = await kpiService.updateKPI(kpiId, kpiData);
      
      // Update state
      setGoal({
        ...goal,
        kpis: goal.kpis.map(kpi => 
          kpi.id === kpiId ? response.kpi : kpi
        )
      });
    } catch (err) {
      console.error('Error updating KPI:', err);
      alert('Failed to update KPI. Please try again.');
    }
  };

  const handleDeleteKPI = async (kpiId) => {
    if (!window.confirm('Are you sure you want to delete this KPI?')) {
      return;
    }
    
    try {
      await kpiService.deleteKPI(kpiId);
      
      // Update state
      setGoal({
        ...goal,
        kpis: goal.kpis.filter(kpi => kpi.id !== kpiId)
      });
    } catch (err) {
      console.error('Error deleting KPI:', err);
      alert('Failed to delete KPI. Please try again.');
    }
  };

  const handleUpdateKPIValue = async (kpiId, valueObj) => {
    try {
      const response = await kpiService.updateKPIValue(kpiId, valueObj);
      // Update KPI state with merged fields
      const updatedKPIs = goal.kpis.map(kpi => 
        kpi.id === kpiId ? { ...kpi, ...valueObj } : kpi
      );
      setGoal({
        ...goal,
        kpis: updatedKPIs,
        progress: response.goal ? response.goal.progress : goal.progress
      });
    } catch (err) {
      console.error('Error updating KPI value:', err);
    }
  };

  // Handle KPIs update after syncing with financial data
  const handleKPIsUpdated = async () => {
    try {
      // Reload goal data to get updated KPIs
      const response = await goalService.getGoalById(id);
      if (response.goal) {
        setGoal(response.goal);
      }
    } catch (err) {
      console.error('Error reloading goal after KPI sync:', err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading goal details...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="goal-details-container">
          <div className="alert alert-danger">{error}</div>
          <button className="btn btn-primary" onClick={handleBackToList}>
            Back to Goals
          </button>
        </div>
      </Layout>
    );
  }

  if (!goal) {
    return (
      <Layout>
        <div className="goal-details-container">
          <div className="alert alert-warning">Goal not found</div>
          <button className="btn btn-primary" onClick={handleBackToList}>
            Back to Goals
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="goal-details-container">
        <div className="goal-details-header">
          <button className="btn btn-secondary" onClick={handleBackToList}>
            &larr; Back to Goals
          </button>
        </div>
        
        <GoalDetail 
          goal={goal}
          relatedTasks={relatedTasks}
          onAddKPI={handleAddKPI}
          onEditKPI={handleEditKPI}
          onDeleteKPI={handleDeleteKPI}
          onUpdateKPI={handleUpdateKPIValue}
          onKPIsUpdated={handleKPIsUpdated}
        />
      </div>
    </Layout>
  );
};

export default GoalDetails;