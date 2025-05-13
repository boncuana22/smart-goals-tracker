import React from 'react';
import './KPICard.css';

const KPICard = ({ kpi, onEdit, onDelete, onUpdateValue }) => {
  // Calculate progress percentage
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

  const getKpiIcon = () => {
    if (kpi.type === 'financial') {
      return <i className="fas fa-coins"></i>;
    }
    return <i className="fas fa-chart-line"></i>;
  };

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <div className="kpi-title">
          <span className="kpi-icon">{getKpiIcon()}</span>
          <h3 className="kpi-name">{kpi.name}</h3>
        </div>
        <div className="kpi-actions">
          <button 
            className="action-btn edit-btn" 
            onClick={() => onEdit(kpi)}
            title="Edit KPI"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            className="action-btn delete-btn" 
            onClick={() => onDelete(kpi.id)}
            title="Delete KPI"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      {kpi.description && (
        <p className="kpi-description">{kpi.description}</p>
      )}
      
      <div className="kpi-metrics">
        <div className="kpi-progress">
          <div className="progress-label">
            <span>Progress</span>
            <span className="progress-value">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="kpi-progress-bar">
            <div 
              className="kpi-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
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
        </div>
      </div>

      {kpi.type === 'financial' && (
        <div className="kpi-financial-info">
          <span className="last-update">
            Last financial update: March 2025
          </span>
        </div>
      )}
    </div>
  );
};

export default KPICard;