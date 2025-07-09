import React, { useState, useEffect } from 'react';
import './KPICreationModal.css';
import financialService from '../../api/financialService';

const KPICreationModal = ({ goal, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [kpiData, setKpiData] = useState({
    type: '',
    name: '',
    description: '',
    target_value: '',
    current_value: '',
    unit: '',
    financial_metric: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [financialMetrics, setFinancialMetrics] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    if (currentStep === 2 && kpiData.type === 'financial') {
      setMetricsLoading(true);
      financialService.getAllFinancialData()
        .then(data => {
          // Flatten all metrics from all financial records
          const allMetrics = [];
          (data.financialData || []).forEach(record => {
            if (record.metrics && Array.isArray(record.metrics)) {
              record.metrics.forEach(metric => {
                allMetrics.push({
                  id: metric.id,
                  name: metric.metric_name || metric.name,
                  value: metric.current_value || metric.value,
                  unit: metric.unit
                });
              });
            }
          });
          setFinancialMetrics(allMetrics);
        })
        .catch(() => setFinancialMetrics([]))
        .finally(() => setMetricsLoading(false));
    }
  }, [currentStep, kpiData.type]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1 && !kpiData.type) newErrors.type = 'Please select a KPI type';
    if (step === 2) {
      if (!kpiData.name.trim()) newErrors.name = 'KPI name is required';
      if (kpiData.type === 'financial' && !kpiData.financial_metric) {
        newErrors.financial_metric = 'Please select a financial metric';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    // If selecting a financial metric, set current_value to its value
    if (field === 'financial_metric') {
      const selectedMetric = financialMetrics.find(m => m.name === value);
      setKpiData(prev => ({
        ...prev,
        financial_metric: value,
        current_value: selectedMetric ? selectedMetric.value : ''
      }));
    } else {
      setKpiData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ ...kpiData, goal_id: goal.id, kpi_type: kpiData.type });
    } catch (error) {
      console.error('Error creating KPI:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kpi-overlay">
      <div className="kpi-creation-modal">
        <div className="modal-header">
          <h2>Creating KPI for "{goal.title}"</h2>
        </div>

        <div className="step-indicator">
          <div className="steps">
            {[1, 2].map(step => (
              <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
                <div className="step-number">{step}</div>
                <div className="step-label">{step === 1 ? 'Type' : 'Details'}</div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${(currentStep / 2) * 100}%` }}></div>
          </div>
        </div>

        <div className="modal-content">
          {currentStep === 1 && (
            <div className="kpi-step">
              <h3>Step 1 of 2 | Choose KPI Type</h3>
              <p className="step-description">What type of KPI do you want to create for "{goal.title}"?</p>
              <div className="kpi-type-options">
                <div className={`kpi-type-option ${kpiData.type === 'operational' ? 'selected' : ''}`} onClick={() => handleInputChange('type', 'operational')}>
                  <div className="type-icon"><i className="fas fa-chart-line"></i></div>
                  <h4>Operational KPI</h4>
                  <p>Measures progress through tasks</p>
                  <ul>
                    <li>Training completion, calls made</li>
                    <li>Progress = task completion %</li>
                    <li>Good for process-driven goals</li>
                  </ul>
                  {kpiData.type === 'operational' && <div className="selection-indicator"><i className="fas fa-check"></i></div>}
                </div>
                <div className={`kpi-type-option ${kpiData.type === 'financial' ? 'selected' : ''}`} onClick={() => handleInputChange('type', 'financial')}>
                  <div className="type-icon"><i className="fas fa-coins"></i></div>
                  <h4>Financial KPI</h4>
                  <p>Tracks financial metrics</p>
                  <ul>
                    <li>Revenue, cost, profit margin</li>
                    <li>Syncs with uploaded data</li>
                    <li>Can include tasks</li>
                  </ul>
                  {kpiData.type === 'financial' && <div className="selection-indicator"><i className="fas fa-check"></i></div>}
                </div>
              </div>
              {errors.type && <div className="error-message">{errors.type}</div>}
            </div>
          )}

          {currentStep === 2 && (
            <div className="kpi-step">
              <h3>Step 2 of 2 | KPI Details</h3>
              <div className="form-group">
                <label htmlFor="kpi-name">KPI Name</label>
                <input id="kpi-name" type="text" value={kpiData.name} onChange={e => handleInputChange('name', e.target.value)} className="form-control" placeholder="Team Training Completion" />
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea value={kpiData.description} onChange={e => handleInputChange('description', e.target.value)} className="form-control" rows="2" placeholder="Describe what this KPI measures" />
              </div>
              {kpiData.type === 'financial' && (
                <div className="form-group">
                  <label>Financial Metric</label>
                  <select value={kpiData.financial_metric} onChange={e => handleInputChange('financial_metric', e.target.value)} className="form-control" disabled={metricsLoading}>
                    <option value="">{metricsLoading ? 'Loading...' : 'Select a metric'}</option>
                    {financialMetrics.map(metric => (
                      <option key={metric.id} value={metric.name}>{metric.name} ({metric.value}{metric.unit})</option>
                    ))}
                  </select>
                  {errors.financial_metric && <div className="error-message">{errors.financial_metric}</div>}
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Target Value</label>
                  <input type="number" value={kpiData.target_value} onChange={e => handleInputChange('target_value', e.target.value)} className="form-control" />
                </div>
                <div className="form-group">
                  <label>Current Value</label>
                  <input 
                    type="number" 
                    value={kpiData.current_value} 
                    onChange={e => handleInputChange('current_value', e.target.value)} 
                    className="form-control" 
                    readOnly={kpiData.type === 'financial'}
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input type="text" value={kpiData.unit} onChange={e => handleInputChange('unit', e.target.value)} className="form-control" placeholder="e.g., %, $, units" />
                </div>
              </div>
              {kpiData.type === 'financial' && !metricsLoading && financialMetrics.length === 0 && (
                <div className="error-message">No financial metrics available. Please upload data first.</div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <div className="left-actions">
            {currentStep > 1 && <button className="btn btn-secondary" onClick={handleBack}>Back</button>}
          </div>
          <div className="right-actions">
            {currentStep < 2 && <button className="btn btn-primary" onClick={handleNext}>Next</button>}
            {currentStep === 2 && <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save KPI'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICreationModal;