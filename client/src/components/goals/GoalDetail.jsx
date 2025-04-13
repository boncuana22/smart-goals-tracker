import React, { useState } from 'react';
import KPICard from './KPICard';
import KPIForm from './KPIForm';
import Modal from '../common/Modal';
import './GoalDetail.css';

const GoalDetail = ({ goal, onUpdateKPI, onAddKPI, onEditKPI, onDeleteKPI, relatedTasks = [] }) => {
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [currentKPI, setCurrentKPI] = useState(null);
  
  // Format date pentru afișare
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleAddKPI = () => {
    setCurrentKPI(null);
    setIsKPIModalOpen(true);
  };
  
  const handleEditKPI = (kpi) => {
    setCurrentKPI(kpi);
    setIsKPIModalOpen(true);
  };
  
  const handleKPISubmit = (kpiData) => {
    if (currentKPI) {
      onEditKPI(currentKPI.id, kpiData);
    } else {
      onAddKPI(kpiData);
    }
    setIsKPIModalOpen(false);
  };
  
  // Gruparea KPI-urilor după progres
  const groupKPIsByProgress = () => {
    if (!goal.kpis || goal.kpis.length === 0) return [];
    
    return goal.kpis.sort((a, b) => {
      const aProgress = a.target_value ? (a.current_value / a.target_value) : 0;
      const bProgress = b.target_value ? (b.current_value / b.target_value) : 0;
      return bProgress - aProgress; // Sortare descrescătoare
    });
  };
  
  const sortedKPIs = groupKPIsByProgress();
  
  return (
    <div className="goal-detail">
      <div className="goal-detail-header">
        <h2>{goal.title}</h2>
        <div className="goal-status">{goal.status}</div>
      </div>
      
      <div className="goal-progress-section">
        <h3>Progress Tracking</h3>
        <div className="goal-progress-container">
          <div className="goal-progress-bar">
            <div 
              className="goal-progress-fill" 
              style={{ width: `${goal.progress || 0}%` }}
            ></div>
          </div>
          <div className="goal-progress-value">{goal.progress || 0}%</div>
        </div>
        <div className="goal-deadline">
          Deadline: {formatDate(goal.time_bound_date)}
        </div>
      </div>
      
      <div className="goal-details-section">
        <h3>SMART Criteria</h3>
        <div className="smart-criteria">
          <div className="criteria-item">
            <h4>Specific</h4>
            <p>{goal.specific_details || 'Not specified'}</p>
          </div>
          <div className="criteria-item">
            <h4>Measurable</h4>
            <p>{goal.measurable_metrics || 'Not specified'}</p>
          </div>
          <div className="criteria-item">
            <h4>Achievable</h4>
            <p>{goal.achievable_factors || 'Not specified'}</p>
          </div>
          <div className="criteria-item">
            <h4>Relevant</h4>
            <p>{goal.relevant_reasoning || 'Not specified'}</p>
          </div>
          <div className="criteria-item">
            <h4>Time-bound</h4>
            <p>{formatDate(goal.time_bound_date)}</p>
          </div>
        </div>
      </div>
      
      <div className="goal-kpis-section">
        <div className="section-header">
          <h3>Key Performance Indicators</h3>
          <button className="btn btn-primary" onClick={handleAddKPI}>
            Add KPI
          </button>
        </div>
        
        {sortedKPIs.length === 0 ? (
          <div className="empty-kpis">
            <p>No KPIs have been defined for this goal yet. KPIs help you measure progress toward your goal.</p>
          </div>
        ) : (
          <div className="kpi-list">
            {sortedKPIs.map(kpi => (
              <KPICard 
                key={kpi.id}
                kpi={kpi}
                onEdit={handleEditKPI}
                onDelete={onDeleteKPI}
                onUpdateValue={(id, value) => onUpdateKPI(id, value)}
              />
            ))}
          </div>
        )}
      </div>
      
      {relatedTasks.length > 0 && (
        <div className="goal-tasks-section">
          <h3>Related Tasks</h3>
          <div className="tasks-list">
            {relatedTasks.map(task => (
              <div key={task.id} className="related-task">
                <div className="task-status-badge">{task.status}</div>
                <div className="task-title">{task.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Modal isOpen={isKPIModalOpen} onClose={() => setIsKPIModalOpen(false)}>
        <KPIForm 
          kpi={currentKPI}
          onSubmit={handleKPISubmit}
          onCancel={() => setIsKPIModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default GoalDetail;