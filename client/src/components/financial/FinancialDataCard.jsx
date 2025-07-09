import React, { useState } from 'react';
import './FinancialDataCard.css';

const FinancialDataCard = ({ data, onDelete, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Formatare dată
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Obținere metrici principale
  const getMainMetrics = () => {
    if (!data.metrics || data.metrics.length === 0) {
      return [];
    }
    
    const mainMetricNames = ['Revenue', 'Gross Margin', 'Operating Profit', 'Net Profit'];
    return data.metrics
      .filter(metric => mainMetricNames.includes(metric.metric_name))
      .sort((a, b) => {
        const indexA = mainMetricNames.indexOf(a.metric_name);
        const indexB = mainMetricNames.indexOf(b.metric_name);
        return indexA - indexB;
      });
  };
  
 
  // Formatare valoare pentru afișare
    const formatValue = (value, unit = '') => {
        if (value === null || value === undefined) return 'N/A';
        
        // Asigură-te că value este un număr
        const numValue = Number(value);
        if (isNaN(numValue)) return 'Invalid';
        
        let formattedValue;
        if (Math.abs(numValue) >= 1000000) {
        formattedValue = (numValue / 1000000).toFixed(2) + 'M';
        } else if (Math.abs(numValue) >= 1000) {
        formattedValue = (numValue / 1000).toFixed(2) + 'K';
        } else {
        formattedValue = numValue.toFixed(2);
        }
        
        return unit === '%' ? `${formattedValue}%` : formattedValue;
    };
  
  const mainMetrics = getMainMetrics();
  
  return (
    <div className="financial-data-card">
      <div className="financial-card-header">
        <div className="financial-card-title">
          <h3>Income Statement</h3>
          <span className="financial-date">{formatDate(data.data_period)}</span>
        </div>
        
        <div className="financial-card-actions">
          <button 
            className="card-action-btn view-btn" 
            onClick={() => onViewDetails(data.id)}
            title="View Details"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button 
            className="card-action-btn delete-btn" 
            onClick={() => onDelete(data.id)}
            title="Delete"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div className="financial-card-metrics">
        {mainMetrics.length > 0 ? (
          <div className="metrics-grid">
            {mainMetrics.map(metric => (
              <div key={metric.id} className="metric-item">
                <div className="metric-name">{metric.metric_name}</div>
                <div className="metric-value">
                  {formatValue(metric.current_value)}
                </div>
                {metric.previous_value && (
                  <div className={`metric-change ${metric.percentage_change >= 0 ? 'positive' : 'negative'}`}>
                    {metric.percentage_change >= 0 ? '▲' : '▼'} 
                    {formatValue(Math.abs(metric.percentage_change), '%')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-metrics">No metrics available</div>
        )}
      </div>
      
      <button 
        className="expand-btn"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show Less' : 'Show More Metrics'} {isExpanded ? '▲' : '▼'}
      </button>
      
      {isExpanded && data.metrics && data.metrics.length > mainMetrics.length && (
        <div className="additional-metrics">
          <div className="metrics-grid">
            {data.metrics
              .filter(metric => !mainMetrics.some(m => m.id === metric.id))
              .map(metric => (
                <div key={metric.id} className="metric-item">
                  <div className="metric-name">{metric.metric_name}</div>
                  <div className="metric-value">
                    {formatValue(metric.current_value, metric.unit)}
                  </div>
                  {metric.previous_value && (
                    <div className={`metric-change ${metric.percentage_change >= 0 ? 'positive' : 'negative'}`}>
                      {metric.percentage_change >= 0 ? '▲' : '▼'} 
                      {formatValue(Math.abs(metric.percentage_change), '%')}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
      
      <div className="financial-card-footer">
        <div className="file-info">
          <span>{data.original_filename}</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialDataCard;