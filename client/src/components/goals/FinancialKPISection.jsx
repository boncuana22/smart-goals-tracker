import React, { useState } from 'react';
import kpiService from '../../api/kpiService';
import './FinancialKPISection.css';

const FinancialKPISection = ({ kpis, goalId, onAddKPI, onKPIsUpdated }) => {
  const [syncingKPIs, setSyncingKPIs] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  
  // Identify which KPIs are financial based on name or description
  const isFinancialKPI = (kpi) => {
    const financialKeywords = [
      'revenue', 'sales', 'profit', 'margin', 'cost', 'expense', 
      'income', 'earnings', 'financial', 'price', 'roi', 'return', 
      'investment', 'cash', 'flow', 'budget', 'spending', 'funding'
    ];
    
    const kpiNameLower = kpi.name.toLowerCase();
    const kpiDescLower = (kpi.description || '').toLowerCase();
    
    return financialKeywords.some(keyword => 
      kpiNameLower.includes(keyword) || kpiDescLower.includes(keyword)
    );
  };
  
  // Filter financial KPIs
  const financialKPIs = kpis.filter(isFinancialKPI);
  
  // Check if there are any financial KPIs
  const hasFinancialKPIs = financialKPIs.length > 0;
  
  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    const numValue = Number(value);
    if (isNaN(numValue)) return 'Invalid';
    
    let formattedValue;
    if (Math.abs(numValue) >= 1000000) {
      formattedValue = `${(numValue / 1000000).toFixed(2)}M`;
    } else if (Math.abs(numValue) >= 1000) {
      formattedValue = `${(numValue / 1000).toFixed(2)}K`;
    } else {
      formattedValue = `${numValue.toFixed(2)}`;
    }
    
    return formattedValue;
  };
  
  // Format percentage values
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    const numValue = Number(value);
    if (isNaN(numValue)) return 'Invalid';
    
    return `${numValue.toFixed(2)}%`;
  };
  
  // Calculate KPI progress percentage
  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  };
  
  // Handle sync KPIs with financial data
  const handleSyncKPIs = async () => {
    try {
      setSyncingKPIs(true);
      setSyncResult(null);
      
      const result = await kpiService.syncFinancialKPIs();
      
      setSyncResult({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        // Reload KPIs after sync
        if (onKPIsUpdated) {
          onKPIsUpdated();
        }
      }
    } catch (error) {
      console.error('Error syncing financial KPIs:', error);
      setSyncResult({
        success: false,
        message: 'Failed to sync KPIs with financial data'
      });
    } finally {
      setSyncingKPIs(false);
      
      // Clear result message after 5 seconds
      setTimeout(() => {
        setSyncResult(null);
      }, 5000);
    }
  };
  
  // Handle creating a new financial KPI template
  const handleAddFinancialKPI = (type) => {
    const kpiTemplates = {
      'revenue': {
        name: 'Revenue Growth',
        description: 'Increase in total revenue from sales',
        target_value: 0,
        current_value: 0,
        unit: 'RON'
      },
      'profit': {
        name: 'Net Profit',
        description: 'Total profit after expenses and taxes',
        target_value: 0,
        current_value: 0,
        unit: 'RON'
      },
      'margin': {
        name: 'Profit Margin',
        description: 'Percentage of revenue retained as profit',
        target_value: 0,
        current_value: 0,
        unit: '%'
      },
      'cost': {
        name: 'Cost Reduction',
        description: 'Reduction in operational costs',
        target_value: 0,
        current_value: 0,
        unit: 'RON'
      }
    };
    
    if (onAddKPI && kpiTemplates[type]) {
      onAddKPI({
        ...kpiTemplates[type],
        goal_id: goalId
      });
    }
  };
  
  return (
    <div className="financial-kpi-section">
      <div className="section-header">
        <h3>Financial KPIs</h3>
        <div className="header-actions">
          <button 
            className="sync-button"
            onClick={handleSyncKPIs}
            disabled={syncingKPIs}
          >
            {syncingKPIs ? 'Syncing...' : 'Sync with Financial Data'}
          </button>
          <div className="add-financial-dropdown">
            <button className="add-financial-btn">Add Financial KPI</button>
            <div className="dropdown-content">
              <button onClick={() => handleAddFinancialKPI('revenue')}>Revenue Growth</button>
              <button onClick={() => handleAddFinancialKPI('profit')}>Net Profit</button>
              <button onClick={() => handleAddFinancialKPI('margin')}>Profit Margin</button>
              <button onClick={() => handleAddFinancialKPI('cost')}>Cost Reduction</button>
            </div>
          </div>
        </div>
      </div>
      
      {syncResult && (
        <div className={`sync-result ${syncResult.success ? 'success' : 'error'}`}>
          {syncResult.message}
        </div>
      )}
      
      {hasFinancialKPIs ? (
        <div className="financial-kpis-grid">
          {financialKPIs.map(kpi => (
            <div key={kpi.id} className="financial-kpi-card">
              <div className="kpi-header">
                <h4>{kpi.name}</h4>
                {kpi.unit === '%' ? (
                  <div className="kpi-value percentage">{formatPercentage(kpi.current_value)}</div>
                ) : (
                  <div className="kpi-value currency">{formatCurrency(kpi.current_value)}</div>
                )}
              </div>
              
              <div className="kpi-description">{kpi.description}</div>
              
              <div className="kpi-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateProgress(kpi.current_value, kpi.target_value)}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span className="current-label">Current: {
                    kpi.unit === '%' ? formatPercentage(kpi.current_value) : formatCurrency(kpi.current_value)
                  }</span>
                  <span className="target-label">Target: {
                    kpi.unit === '%' ? formatPercentage(kpi.target_value) : formatCurrency(kpi.target_value)
                  }</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-financial-kpis">
          <p>No financial KPIs defined for this goal yet.</p>
          <p>Add financial KPIs to track revenue, profit margin, and other financial metrics.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialKPISection;