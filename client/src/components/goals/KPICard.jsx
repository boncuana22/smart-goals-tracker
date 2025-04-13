import React from 'react';
import './KPICard.css';

const KPICard = ({ kpi, onEdit, onDelete, onUpdateValue }) => {
  // Calculare procent pentru progress bar
  const calculateProgress = () => {
    if (!kpi.target_value || kpi.target_value === 0) return 0;
    const progress = (kpi.current_value / kpi.target_value) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const progressPercent = calculateProgress();

  const handleValueChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onUpdateValue(kpi.id, newValue);
    }
  };

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <h3 className="kpi-name">{kpi.name}</h3>
        <div className="kpi-actions">
          <button 
            className="action-btn edit-btn" 
            onClick={() => onEdit(kpi)}
            title="Edit KPI"
          >
            ✏️
          </button>
          <button 
            className="action-btn delete-btn" 
            onClick={() => onDelete(kpi.id)}
            title="Delete KPI"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {kpi.description && (
        <p className="kpi-description">{kpi.description}</p>
      )}
      
      <div className="kpi-metrics">
        <div className="kpi-progress-bar">
          <div 
            className="kpi-progress-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        <div className="kpi-values">
          <div className="kpi-current">
            <label>Current</label>
            <div className="value-input-wrapper">
              <input 
                type="number" 
                value={kpi.current_value || 0} 
                onChange={handleValueChange}
                className="current-value-input"
                step="0.01"
              />
              {kpi.unit && <span className="unit">{kpi.unit}</span>}
            </div>
          </div>
          
          <div className="kpi-target">
            <label>Target</label>
            <div className="target-value">
              {kpi.target_value || 0}
              {kpi.unit && <span className="unit">{kpi.unit}</span>}
            </div>
          </div>
          
          <div className="kpi-percentage">
            <label>Progress</label>
            <div className="percentage-value">
              {progressPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICard;