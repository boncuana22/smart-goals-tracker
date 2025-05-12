import React, { useState } from 'react';
import KPICard from './KPICard';
import KPIForm from './KPIForm';
import Modal from '../common/Modal';
import FinancialKPISection from './FinancialKpiSection';
import './GoalDetail.css';

const GoalDetail = ({ 
  goal, 
  relatedTasks, 
  onAddKPI, 
  onEditKPI, 
  onDeleteKPI, 
  onUpdateKPI,
  onKPIsUpdated 
}) => {
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [currentKPI, setCurrentKPI] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  const handleAddKPI = () => {
    setCurrentKPI(null);
    setIsKPIModalOpen(true);
  };

  const handleEditKPI = (kpi) => {
    setCurrentKPI(kpi);
    setIsKPIModalOpen(true);
  };

  const handleSubmitKPI = async (formData) => {
    try {
      if (currentKPI) {
        await onEditKPI(currentKPI.id, formData);
      } else {
        await onAddKPI(formData);
      }
      setIsKPIModalOpen(false);
    } catch (error) {
      console.error('Error saving KPI:', error);
    }
  };

  if (!goal) {
    return <div>Loading goal details...</div>;
  }

  return (
    <div className="goal-detail">
      <div className="goal-detail-header">
        <h2>{goal.title}</h2>
        <span className={`goal-status ${getStatusClass()}`}>
          {goal.status}
        </span>
      </div>

      <div className="goal-progress-section">
        <h3>Progress</h3>
        <div className="goal-progress-container">
          <div className="goal-progress-bar">
            <div 
              className="goal-progress-fill" 
              style={{ width: `${goal.progress || 0}%` }}
            ></div>
          </div>
          <span className="goal-progress-value">{goal.progress || 0}%</span>
        </div>
        {goal.time_bound_date && (
          <p className="goal-deadline">
            Deadline: {formatDate(goal.time_bound_date)}
          </p>
        )}
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
        </div>
        {goal.description && (
          <div className="criteria-item">
            <h4>Description</h4>
            <p>{goal.description}</p>
          </div>
        )}
      </div>

      <div className="goal-kpis-section">
        <div className="section-header">
          <h3>Key Performance Indicators</h3>
          <button className="btn btn-primary" onClick={handleAddKPI}>
            Add KPI
          </button>
        </div>

        {goal.kpis && goal.kpis.length > 0 ? (
          <div className="kpi-list">
            {goal.kpis.map(kpi => (
              <KPICard 
                key={kpi.id}
                kpi={kpi}
                onEdit={handleEditKPI}
                onDelete={onDeleteKPI}
                onUpdateValue={onUpdateKPI}
              />
            ))}
          </div>
        ) : (
          <div className="empty-kpis">
            No KPIs defined for this goal yet.
          </div>
        )}
      </div>

      {/* Financial KPIs Section */}
      <FinancialKPISection 
        kpis={goal.kpis || []}
        goalId={goal.id}
        onAddKPI={onAddKPI}
        onKPIsUpdated={onKPIsUpdated}
      />

      {relatedTasks && relatedTasks.length > 0 && (
        <div className="goal-tasks-section">
          <h3>Related Tasks</h3>
          <div className="tasks-list">
            {relatedTasks.map(task => (
              <div key={task.id} className="related-task">
                <span className="task-status-badge">{task.status}</span>
                <span className="task-title">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isKPIModalOpen} onClose={() => setIsKPIModalOpen(false)}>
        <KPIForm 
          kpi={currentKPI}
          onSubmit={handleSubmitKPI}
          onCancel={() => setIsKPIModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default GoalDetail;