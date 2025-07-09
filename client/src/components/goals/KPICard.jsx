import React from 'react';
import './KPICard.css';

const KPICard = ({ kpi, onEdit, onDelete, onUpdateValue }) => {
  const handleCurrentValueChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onUpdateValue(kpi.id, { current_value: newValue });
    }
  };

  const handleAchievedChange = (e) => {
    onUpdateValue(kpi.id, { is_achieved: e.target.checked });
  };

  const getKpiIcon = () => {
    if (kpi.kpi_type === 'financial' || kpi.type === 'financial') {
      return <i className="fas fa-coins"></i>;
    }
    return <i className="fas fa-chart-line"></i>;
  };

  return (
    <div className={`kpi-card${kpi.is_achieved ? ' achieved' : ''}`}>
      <div className="kpi-header">
        <div className="kpi-title">
          <span className="kpi-icon">{getKpiIcon()}</span>
          <h3 className="kpi-name">{kpi.name}</h3>
        </div>
        <div className="kpi-actions">
          <button className="action-btn edit-btn" onClick={() => onEdit(kpi)} title="Edit KPI">
            <i className="fas fa-edit"></i>
          </button>
          <button className="action-btn delete-btn" onClick={() => onDelete(kpi.id)} title="Delete KPI">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {kpi.description && (
        <p className="kpi-description">{kpi.description}</p>
      )}

      <div className="kpi-values-row">
        <div className="kpi-value-block">
          <span className="kpi-label">Current</span>
          <input
            type="number"
            value={kpi.current_value ?? 0}
            onChange={handleCurrentValueChange}
            className="current-value-input"
            step="0.01"
          />
          {kpi.unit && <span className="unit">{kpi.unit}</span>}
        </div>
        <div className="kpi-value-block">
          <span className="kpi-label">Target</span>
          <span className="kpi-value">
            <strong>{parseFloat(kpi.target_value).toFixed(2)}</strong>
            {kpi.unit && <span className="unit"> {kpi.unit}</span>}
          </span>
        </div>
      </div>

      <div className="kpi-achieved-checkbox">
        <input
          type="checkbox"
          id={`achieved-${kpi.id}`}
          className="badge-toggle"
          checked={!!kpi.is_achieved}
          onChange={handleAchievedChange}
        />
        <label htmlFor={`achieved-${kpi.id}`} className="badge-label">
          <i className="fas fa-check-circle"></i>
          {kpi.is_achieved ? ' Achieved' : ' Mark as Achieved'}
        </label>
      </div>
    </div>
  );
};

export default KPICard;