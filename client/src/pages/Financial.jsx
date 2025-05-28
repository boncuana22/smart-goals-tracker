import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import FinancialDataCard from '../components/financial/FinancialDataCard';
import FileUploadForm from '../components/financial/FileUploadForm';
import FinancialMetricsChart from '../components/financial/FinancialMetricsChart';
import Modal from '../components/common/Modal';
import financialService from '../api/financialService';
import './Financial.css';

const Financial = () => {
  const [financialData, setFinancialData] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('bar');
  
  useEffect(() => {
    loadFinancialData();
  }, []);
  
  const loadFinancialData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await financialService.getAllFinancialData();
      setFinancialData(response.financialData || []);
    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUploadFile = async (formData) => {
    try {
      const response = await financialService.uploadFinancialData(formData);
      
      // Adăugare date noi la lista existentă
      setFinancialData([response.financialData, ...financialData]);
      
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error('Error uploading financial data:', err);
      throw err; // Propagă eroarea către componenta FileUploadForm pentru afișare
    }
  };
  
  const handleDeleteFinancialData = async (id) => {
    if (!window.confirm('Are you sure you want to delete this financial record?')) {
      return;
    }
    
    try {
      await financialService.deleteFinancialData(id);
      
      // Actualizare listă
      setFinancialData(financialData.filter(data => data.id !== id));
    } catch (err) {
      console.error('Error deleting financial data:', err);
      alert('Failed to delete financial data. Please try again.');
    }
  };
  
  return (
    <Layout>
      <div className="financial-container">
        <div className="financial-header">
          <h2>Financial Data</h2>
          <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
            Upload Financial Data
          </button>
        </div>
        
        {financialData.length > 0 && (
          <div className="financial-chart-section">
            <div className="chart-header">
              <h3>Financial Metrics Visualization</h3>
              <div className="chart-type-selector">
                <button 
                  className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  Bar Chart
                </button>
                <button 
                  className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                  onClick={() => setChartType('line')}
                >
                  Line Chart
                </button>
              </div>
            </div>
            <FinancialMetricsChart 
              financialData={financialData}
              chartType={chartType}
            />
          </div>
        )}
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {isLoading ? (
          <div className="loading">Loading financial data...</div>
        ) : financialData.length === 0 ? (
          <div className="empty-financial">
            <p>No financial data has been uploaded yet.</p>
            <p>Upload financial data to analyze key business metrics.</p>
            <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
              Upload Your First Financial Data
            </button>
          </div>
        ) : (
          <div className="financial-data-grid">
            {financialData.map(data => (
              <FinancialDataCard 
                key={data.id}
                data={data}
                onDelete={handleDeleteFinancialData}
                
              />
            ))}
          </div>
        )}
        
        <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}>
          <FileUploadForm 
            onSubmit={handleUploadFile}
            onCancel={() => setIsUploadModalOpen(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default Financial;