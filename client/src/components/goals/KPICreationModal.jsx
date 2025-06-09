import React, { useState } from 'react';
import './KPICreationModal.css';

const KPICreationModal = ({ goal, onSubmit, onCancel, existingKPIs = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [kpiData, setKpiData] = useState({
    type: '', // 'operational' or 'financial'
    name: '',
    description: '',
    target_value: '',
    current_value: '',
    unit: '',
    weight_in_goal: 0,
    // Financial KPI specific fields
    financial_progress_weight: 80,
    tasks_progress_weight: 20,
    financial_metric: '',
    target_percentage: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total weight of existing KPIs
  const totalExistingWeight = existingKPIs.reduce((sum, kpi) => sum + (parseFloat(kpi.weight_in_goal) || 0), 0);
  const remainingWeight = 100 - totalExistingWeight;

  // Validation for each step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!kpiData.type) {
          newErrors.type = 'Please select a KPI type';
        }
        break;
      case 2:
        if (!kpiData.name.trim()) {
          newErrors.name = 'KPI name is required';
        }
        
        // For financial KPIs, require target value and unit
        if (kpiData.type === 'financial') {
          if (!kpiData.target_value || kpiData.target_value <= 0) {
            newErrors.target_value = 'Target value is required for financial KPIs';
          }
          if (!kpiData.unit) {
            newErrors.unit = 'Unit is required for financial KPIs';
          }
          
          const finWeight = parseFloat(kpiData.financial_progress_weight);
          const taskWeight = parseFloat(kpiData.tasks_progress_weight);
          if (Math.abs((finWeight + taskWeight) - 100) > 0.01) {
            newErrors.progress_weights = 'Financial and tasks weights must add up to 100%';
          }
        }
        break;
      case 3: {
        const weight = parseFloat(kpiData.weight_in_goal);
        if (weight <= 0) {
          newErrors.weight = 'Weight must be greater than 0%';
        }
        if (weight > remainingWeight) {
          newErrors.weight = `Weight cannot exceed ${remainingWeight}% (remaining weight)`;
        }
        break;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setKpiData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setIsSubmitting(true);
    try {
      const submitData = {
        ...kpiData,
        goal_id: goal.id,
        kpi_type: kpiData.type
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error creating KPI:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Choose KPI Type
  const renderStep1 = () => (
    <div className="kpi-step">
      <h3>Step 1 of 4 | Choose KPI Type</h3>
      <p className="step-description">What type of KPI do you want to create for "{goal.title}"?</p>
      
      <div className="kpi-type-options">
        <div 
          className={`kpi-type-option ${kpiData.type === 'operational' ? 'selected' : ''}`}
          onClick={() => handleInputChange('type', 'operational')}
        >
          <div className="type-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <h4>Operational KPI</h4>
          <p>Measures progress through tasks</p>
          <ul>
            <li>Examples: Training completion, calls made, features developed</li>
            <li>Progress = Task completion percentage</li>
            <li>Perfect for process-driven goals</li>
          </ul>
          {kpiData.type === 'operational' && <div className="selection-indicator"><i className="fas fa-check"></i></div>}
        </div>
        
        <div 
          className={`kpi-type-option ${kpiData.type === 'financial' ? 'selected' : ''}`}
          onClick={() => handleInputChange('type', 'financial')}
        >
          <div className="type-icon">
            <i className="fas fa-coins"></i>
          </div>
          <h4>Financial KPI</h4>
          <p>Tracks financial metrics</p>
          <ul>
            <li>Examples: Revenue growth, cost reduction, profit margin</li>
            <li>Automatically syncs with uploaded financial data</li>
            <li>Can include supporting tasks</li>
          </ul>
          {kpiData.type === 'financial' && <div className="selection-indicator"><i className="fas fa-check"></i></div>}
        </div>
      </div>
      
      {errors.type && <div className="error-message">{errors.type}</div>}
    </div>
  );

  // Step 2: KPI Details
  const renderStep2 = () => (
    <div className="kpi-step">
      <h3>Step 2 of 4 | {kpiData.type === 'operational' ? 'Operational' : 'Financial'} KPI Details</h3>
      
      <div className="form-group">
        <label htmlFor="kpi-name">KPI Name</label>
        <input
          type="text"
          id="kpi-name"
          value={kpiData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder={kpiData.type === 'operational' ? 'Team Training Completion' : 'Revenue Growth Q1'}
          className="form-control"
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="kpi-description">Description (Optional)</label>
        <textarea
          id="kpi-description"
          value={kpiData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what this KPI measures"
          className="form-control"
          rows="2"
        />
      </div>
      
      {kpiData.type === 'operational' && (
        <div className="kpi-explanation">
          <h4>🎯 This KPI will track:</h4>
          <ul>
            <li>✓ Progress through tasks you assign</li>
            <li>✓ Each task counts equally (1/n)</li>
            <li>✓ Completed tasks = 100%, In Progress = 50%</li>
          </ul>
          <p>Next: You'll set this KPI's importance in the overall goal (weight percentage)</p>
        </div>
      )}
      
      {kpiData.type === 'financial' && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="target-value">
                Target Value {kpiData.type === 'financial' && <span className="required">*</span>}
              </label>
              <input
                type="number"
                id="target-value"
                value={kpiData.target_value}
                onChange={(e) => handleInputChange('target_value', e.target.value)}
                placeholder="15"
                className="form-control"
                step="0.01"
                required={kpiData.type === 'financial'}
              />
              {errors.target_value && <div className="error-message">{errors.target_value}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="unit">
                Unit {kpiData.type === 'financial' && <span className="required">*</span>}
              </label>
              <select
                id="unit"
                value={kpiData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="form-control"
                required={kpiData.type === 'financial'}
              >
                <option value="">Select unit...</option>
                <option value="%">% (Percentage)</option>
                <option value="RON">RON</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="">No unit</option>
              </select>
              {errors.unit && <div className="error-message">{errors.unit}</div>}
            </div>
          </div>
          
          <div className="progress-source-section">
            <h4>Progress Source:</h4>
            <div className="form-group">
              <label>How should progress be calculated?</label>
              <div className="progress-weight-inputs">
                <div className="weight-input-group">
                  <label>Financial data</label>
                  <input
                    type="number"
                    value={kpiData.financial_progress_weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange('financial_progress_weight', value);
                      handleInputChange('tasks_progress_weight', 100 - parseFloat(value || 0));
                    }}
                    className="form-control weight-input"
                    min="0"
                    max="100"
                  />
                  <span className="weight-unit">%</span>
                </div>
                
                <div className="weight-separator">+</div>
                
                <div className="weight-input-group">
                  <label>Supporting tasks</label>
                  <input
                    type="number"
                    value={kpiData.tasks_progress_weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange('tasks_progress_weight', value);
                      handleInputChange('financial_progress_weight', 100 - parseFloat(value || 0));
                    }}
                    className="form-control weight-input"
                    min="0"
                    max="100"
                  />
                  <span className="weight-unit">%</span>
                </div>
              </div>
              {errors.progress_weights && <div className="error-message">{errors.progress_weights}</div>}
            </div>
          </div>
          
          <div className="kpi-explanation">
            <h4>How it works:</h4>
            <ul>
              <li>Progress automatically updates from latest financial data upload</li>
              <li>You can add support tasks to help achieve this KPI</li>
              <li>{kpiData.financial_progress_weight}% from financial data, {kpiData.tasks_progress_weight}% from tasks</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );

  // Step 3: Set Weight
  const renderStep3 = () => (
    <div className="kpi-step">
      <h3>Step 3 of 4 | Set KPI Weight in Goal</h3>
      <p className="step-description">How important is this KPI for reaching "{goal.title}"?</p>
      
      <div className="weight-visualization">
        <h4>Current KPIs in this goal:</h4>
        <div className="kpis-weight-list">
          {existingKPIs.map(kpi => (
            <div key={kpi.id} className="kpi-weight-item">
              <span className="kpi-name">{kpi.name}</span>
              <div className="weight-bar">
                <div 
                  className="weight-fill existing" 
                  style={{ width: `${kpi.weight_in_goal}%` }}
                />
              </div>
              <span className="weight-value">{kpi.weight_in_goal}%</span>
            </div>
          ))}
          
          <div className="kpi-weight-item new-kpi">
            <span className="kpi-name">{kpiData.name || 'New KPI'}</span>
            <div className="weight-bar">
              <div 
                className="weight-fill new" 
                style={{ width: `${kpiData.weight_in_goal}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={remainingWeight}
              value={kpiData.weight_in_goal}
              onChange={(e) => handleInputChange('weight_in_goal', e.target.value)}
              className="weight-slider"
            />
            <span className="weight-value">{kpiData.weight_in_goal}%</span>
          </div>
        </div>
        
        <div className="weight-summary">
          <div className="weight-total">
            <span>Total weight: {totalExistingWeight + parseFloat(kpiData.weight_in_goal || 0)}%</span>
            <span className={`remaining ${remainingWeight - kpiData.weight_in_goal < 0 ? 'negative' : ''}`}>
              Remaining: {remainingWeight - kpiData.weight_in_goal}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="weight-tips">
        <h4>Tips:</h4>
        <ul>
          <li>Higher percentage = more important for goal success</li>
          <li>All KPI weights should ideally add up to 100%</li>
          <li>You can adjust weights later if needed</li>
        </ul>
      </div>
      
      {errors.weight && <div className="error-message">{errors.weight}</div>}
    </div>
  );

  // Step 4: Review & Confirm
  const renderStep4 = () => (
    <div className="kpi-step">
      <h3>Step 4 of 4 | Review Your KPI</h3>
      
      <div className="kpi-review">
        <div className="review-header">
          <h4>{kpiData.name}</h4>
          <span className="kpi-type-badge">{kpiData.type}</span>
        </div>
        
        <div className="review-content">
          {kpiData.description && (
            <div className="review-item">
              <label>Description:</label>
              <span>{kpiData.description}</span>
            </div>
          )}
          
          {kpiData.type === 'financial' && (
            <>
              <div className="review-item">
                <label>Target:</label>
                <span>{kpiData.target_value}{kpiData.unit}</span>
              </div>
              <div className="review-item">
                <label>Progress source:</label>
                <span>{kpiData.financial_progress_weight}% financial + {kpiData.tasks_progress_weight}% tasks</span>
              </div>
            </>
          )}
          
          <div className="review-item">
            <label>Goal weight:</label>
            <span>{kpiData.weight_in_goal}%</span>
          </div>
        </div>
        
        <div className="how-it-works">
          <h4>How it works:</h4>
          {kpiData.type === 'operational' ? (
            <ul>
              <li>Track progress through task completion</li>
              <li>Each completed task counts toward KPI progress</li>
              <li>This KPI represents {kpiData.weight_in_goal}% of goal success</li>
            </ul>
          ) : (
            <ul>
              <li>Progress updates automatically from latest financial data upload</li>
              <li>You can add support tasks if needed</li>
              <li>This KPI represents {kpiData.weight_in_goal}% of goal success</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="kpi-creation-modal">
      <div className="modal-header">
        <h2>Creating KPI for "{goal.title}"</h2>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>
      
      <div className="step-indicator">
        <div className="steps">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
              <div className="step-number">{step}</div>
              <div className="step-label">
                {step === 1 && 'Type'}
                {step === 2 && 'Details'}
                {step === 3 && 'Weight'}
                {step === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(currentStep / 4) * 100}%` }} />
        </div>
      </div>
      
      <div className="modal-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
      
      <div className="modal-actions">
        <div className="left-actions">
          {currentStep > 1 && (
            <button className="btn btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
        </div>
        
        <div className="right-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          {currentStep < 4 ? (
            <button 
              className="btn btn-primary" 
              onClick={handleNext}
            >
              Next: {currentStep === 1 ? 'Set Details' : currentStep === 2 ? 'Set Weight' : 'Review'}
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create KPI'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICreationModal;