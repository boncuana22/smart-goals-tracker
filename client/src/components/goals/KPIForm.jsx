import React, { useState, useEffect } from 'react';
import './KPIForm.css';

const KPIForm = ({ kpi, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_value: '',
    current_value: '',
    unit: ''
  });

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name || '',
        description: kpi.description || '',
        target_value: kpi.target_value || '',
        current_value: kpi.current_value || '',
        unit: kpi.unit || ''
      });
    }
  }, [kpi]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="kpi-form-container">
      <h2>{kpi ? 'Edit KPI' : 'Add New KPI'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">KPI Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-control"
            placeholder="e.g., Revenue Growth"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            placeholder="Describe what this KPI measures"
            rows="2"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="target_value">Target Value</label>
            <input
              type="number"
              id="target_value"
              name="target_value"
              value={formData.target_value}
              onChange={handleChange}
              required
              step="0.01"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="current_value">Current Value</label>
            <input
              type="number"
              id="current_value"
              name="current_value"
              value={formData.current_value}
              onChange={handleChange}
              required
              step="0.01"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="unit">Unit</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., %, $, units"
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {kpi ? 'Update KPI' : 'Add KPI'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KPIForm;