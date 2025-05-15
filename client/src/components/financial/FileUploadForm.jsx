import React, { useState } from 'react';
import './FileUploadForm.css';

const FileUploadForm = ({ onSubmit, onCancel }) => {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['.xls', '.xlsx', '.csv'];
      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
      if (!validTypes.includes(fileExtension)) {
        setError('Please select a valid Excel or CSV file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end dates for the period.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.');
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', 'Balance Sheet');
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      await onSubmit(formData);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload Balance Sheet</h2>
      <div className="upload-instructions">
        <p>Upload a balance sheet file to analyze key metrics like revenue, margins, and profitability.</p>
        <p>Supported formats: Excel (.xls, .xlsx) and CSV (.csv)</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file">Select File</label>
          <div className="file-input-wrapper">
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              accept=".xls,.xlsx,.csv"
              className="file-input"
            />
            <label htmlFor="file" className="file-input-label">
              {file ? file.name : 'Choose file...'}
            </label>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Period Start</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Period End</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="form-control"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUploadForm;