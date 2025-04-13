import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './FinancialMetricsChart.css';

// Înregistrarea componentelor Chart.js necesare
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const FinancialMetricsChart = ({ financialData, chartType = 'bar' }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  
  // Funcția pentru activarea/dezactivarea metricilor
  const handleMetricToggle = (metricName) => {
    if (selectedMetrics.includes(metricName)) {
      setSelectedMetrics(selectedMetrics.filter(name => name !== metricName));
    } else {
      setSelectedMetrics([...selectedMetrics, metricName]);
    }
  };
  
  // Extragerea metricilor disponibile din toate datele financiare
  useEffect(() => {
    if (financialData && financialData.length > 0) {
      const allMetrics = new Set();
      
      financialData.forEach(data => {
        // Verifică dacă data.metrics există
        if (data && data.metrics && data.metrics.length > 0) {
          data.metrics.forEach(metric => {
            allMetrics.add(metric.metric_name);
          });
        }
      });
      
      const metricsList = Array.from(allMetrics);
      setAvailableMetrics(metricsList);
      
      // Selectează automat primele 2-3 metrici importante
      const defaultMetrics = ['Revenue', 'Gross Margin', 'Net Profit']
        .filter(name => metricsList.includes(name));
      
      if (defaultMetrics.length > 0) {
        setSelectedMetrics(defaultMetrics);
      } else if (metricsList.length > 0) {
        setSelectedMetrics(metricsList.slice(0, Math.min(3, metricsList.length)));
      }
    }
  }, [financialData]);
  
  // Prepararea datelor pentru grafic
  useEffect(() => {
    if (financialData && financialData.length > 0 && selectedMetrics.length > 0) {
      // Sortarea datelor după dată
      const sortedData = [...financialData].sort((a, b) => 
        new Date(a.data_period) - new Date(b.data_period)
      );
      
      // Formatarea datelor pentru labels
      const labels = sortedData.map(data => {
        const date = new Date(data.data_period);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
      });
      
      // Crearea datasets pentru fiecare metrică selectată
      const datasets = selectedMetrics.map((metricName, index) => {
        const colors = [
          { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
          { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
          { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
          { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
          { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' }
        ];
        const color = colors[index % colors.length];
        
        return {
          label: metricName,
          data: sortedData.map(data => {
            // Verifică dacă data și data.metrics există
            if (!data || !data.metrics) {
              return null;
            }
            const metric = data.metrics.find(m => m.metric_name === metricName);
            return metric ? metric.current_value : null;
          }),
          backgroundColor: color.bg,
          borderColor: color.border,
          borderWidth: 1
        };
      });
      
      setChartData({
        labels,
        datasets
      });
    }
  }, [financialData, selectedMetrics]);
  
  // Verifică dacă avem date pentru grafic
  if (!chartData) {
    return (
      <div className="chart-loading">
        {financialData && financialData.length > 0 
          ? 'Select metrics to visualize...' 
          : 'No financial data available for visualization.'}
      </div>
    );
  }
  
  // Opțiuni pentru grafic
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Financial Metrics Comparison'
      }
    }
  };
  
  return (
    <div className="financial-chart-container">
      <div className="metrics-selector">
        <h4>Select Metrics to Display:</h4>
        <div className="metrics-checkboxes">
          {availableMetrics.map(metric => (
            <label key={metric} className="metric-checkbox">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric)}
                onChange={() => handleMetricToggle(metric)}
              />
              {metric}
            </label>
          ))}
        </div>
      </div>
      
      <div className="chart-wrapper">
        {chartType === 'bar' ? (
          <Bar data={chartData} options={options} height={300} />
        ) : (
          <Line data={chartData} options={options} height={300} />
        )}
      </div>
    </div>
  );
};

export default FinancialMetricsChart;