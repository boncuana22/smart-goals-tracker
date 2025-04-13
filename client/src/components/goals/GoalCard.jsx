import React from 'react';
import { Link } from 'react-router-dom';
import './GoalCard.css';

const GoalCard = ({ goal, onEdit, onDelete }) => {
  // Calculare procent pentru progress bar
  const progressPercent = goal.progress || 0;
  
  // Format date pentru afișare
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Determinare clasă CSS pentru status
  const getStatusClass = () => {
    switch (goal.status) {
      case 'Not Started':
        return 'status-not-started';
      case 'In Progress':
        return 'status-in-progress';
      case 'Completed':
        return 'status-completed';
      case 'On Hold':
        return 'status-on-hold';
      default:
        return '';
    }
  };

  return (
    <div className="goal-card">
      <div className="goal-header">
        <h3 className="goal-title">{goal.title}</h3>
        <span className={`goal-status ${getStatusClass()}`}>
          {goal.status}
        </span>
      </div>
      
      {goal.description && (
        <p className="goal-description">{goal.description}</p>
      )}
      
      <div className="goal-metrics">
        <div className="goal-progress-wrapper">
          <div className="goal-progress-bar">
            <div 
              className="goal-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="goal-progress-text">{progressPercent}% Complete</span>
        </div>
        
        <div className="goal-kpis">
          {goal.kpis && goal.kpis.length > 0 ? (
            <div className="kpi-count">{goal.kpis.length} KPIs</div>
          ) : (
            <div className="kpi-count empty">No KPIs</div>
          )}
        </div>
      </div>
      
      <div className="goal-footer">
        <div className="goal-deadline">
          🗓️ Deadline: {formatDate(goal.time_bound_date)}
        </div>
        
        <div className="goal-actions">
          <button 
            className="action-btn view-btn" 
            onClick={() => window.location.href = `/goals/${goal.id}`}
            title="View Details"
          >
            👁️
          </button>
          <button 
            className="action-btn edit-btn" 
            onClick={() => onEdit(goal)}
            title="Edit Goal"
          >
            ✏️
          </button>
          <button 
            className="action-btn delete-btn" 
            onClick={() => onDelete(goal.id)}
            title="Delete Goal"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {goal.tasks && goal.tasks.length > 0 && (
        <div className="goal-tasks">
          <small>Related Tasks: {goal.tasks.length}</small>
        </div>
      )}
    </div>
  );
};

export default GoalCard;