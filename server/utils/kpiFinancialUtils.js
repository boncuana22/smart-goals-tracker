/**
 * Utility functions for connecting KPIs with financial data
 */
const { FinancialData, FinancialMetric, KPI, Goal } = require('../models');

/**
 * Extract financial metrics from the database that match specific KPI types
 * @param {Array} kpis - Array of KPI objects
 * @param {Number} userId - User ID for fetching financial data
 * @returns {Promise<Array>} - Array of updated KPIs with financial data
 */
const connectKPIsWithFinancialData = async (kpis, userId) => {
  if (!kpis || kpis.length === 0) {
    return [];
  }
  
  try {
    // Fetch most recent financial data uploaded by user
    const financialData = await FinancialData.findAll({
      where: { uploaded_by: userId },
      include: [{ model: FinancialMetric, as: 'metrics' }],
      order: [['data_period', 'DESC']],
      limit: 2 // Get two most recent to calculate changes
    });
    
    if (!financialData || financialData.length === 0) {
      return kpis; // Return original KPIs if no financial data found
    }
    
    // Get metrics from most recent financial data
    const currentMetrics = financialData[0]?.metrics || [];
    
    // Get metrics from previous financial data (if exists)
    const previousMetrics = financialData.length > 1 ? financialData[1]?.metrics || [] : [];
    
    // Create a map of current metrics by name for easy lookup
    const metricsMap = {};
    currentMetrics.forEach(metric => {
      metricsMap[metric.metric_name.toLowerCase()] = metric;
    });
    
    // Create a map of previous metrics by name for change calculation
    const previousMetricsMap = {};
    previousMetrics.forEach(metric => {
      previousMetricsMap[metric.metric_name.toLowerCase()] = metric;
    });
    
    // Define mappings between KPI names/descriptions and financial metrics
    const kpiMetricMappings = [
      { kpiKeys: ['revenue', 'sales', 'income'], metricName: 'Revenue' },
      { kpiKeys: ['profit', 'net profit', 'earnings'], metricName: 'Net Profit' },
      { kpiKeys: ['gross margin', 'margin'], metricName: 'Gross Margin' },
      { kpiKeys: ['cost', 'cogs', 'goods sold'], metricName: 'Cost of Goods Sold' },
      { kpiKeys: ['expense', 'operating expense'], metricName: 'Operating Expenses' },
      { kpiKeys: ['operating profit', 'ebit'], metricName: 'Operating Profit' },
      { kpiKeys: ['profit margin', 'net margin'], metricName: 'Net Profit Margin' }
    ];
    
    // Parse and update KPIs with financial data
    const updatedKpis = await Promise.all(kpis.map(async kpi => {
      // Skip if KPI is not financial
      if (!kpi.name || !isFinancialKPI(kpi)) {
        return kpi;
      }
      
      const kpiNameLower = kpi.name.toLowerCase();
      const kpiDescLower = (kpi.description || '').toLowerCase();
      
      // Find matching metric based on KPI name or description
      let matchedMetric = null;
      
      for (const mapping of kpiMetricMappings) {
        if (mapping.kpiKeys.some(key => kpiNameLower.includes(key) || kpiDescLower.includes(key))) {
          matchedMetric = metricsMap[mapping.metricName.toLowerCase()];
          break;
        }
      }
      
      // If we found a matching metric, update the KPI
      if (matchedMetric) {
        const previousMetric = previousMetricsMap[matchedMetric.metric_name.toLowerCase()];
        
        // Get change percentage if previous metric exists
        const changePercentage = previousMetric 
          ? ((matchedMetric.current_value - previousMetric.current_value) / previousMetric.current_value) * 100 
          : null;
        
        // If KPI has no target value, set matched metric value as current value
        if (!kpi.target_value || kpi.target_value === 0) {
          // Use the KPI's current value or matched metric if not set
          kpi.current_value = kpi.current_value || matchedMetric.current_value;
          
          // Set a default target based on the current value and change percentage
          if (changePercentage !== null) {
            // Target is current + a projection based on change (e.g., 10% increase)
            kpi.target_value = matchedMetric.current_value * (1 + (changePercentage / 100));
            
            // For metrics that should decrease (like costs), adjust target
            if (kpiNameLower.includes('cost') || kpiNameLower.includes('expense')) {
              // If costs are increasing, set target to reduce them
              if (changePercentage > 0) {
                kpi.target_value = matchedMetric.current_value * 0.9; // 10% reduction
              }
            }
          } else {
            // No change data, set a default target (10% increase or 5% decrease for costs)
            const growthFactor = kpiNameLower.includes('cost') || kpiNameLower.includes('expense') 
              ? 0.95 // 5% reduction for costs
              : 1.1;  // 10% increase for revenue, profit, etc.
              
            kpi.target_value = matchedMetric.current_value * growthFactor;
          }
        } else {
          // KPI already has a target, just update current value if not manually set
          kpi.current_value = kpi.current_value || matchedMetric.current_value;
        }
        
        // Save updated KPI to database if it's a database model
        if (kpi.save) {
          try {
            await kpi.save();
            
            // Update goal progress if this KPI is linked to a goal
            if (kpi.goal_id) {
              const goal = await Goal.findByPk(kpi.goal_id, {
                include: [
                  { model: KPI, as: 'kpis' },
                  { model: Task, as: 'tasks' }
                ]
              });
              
              if (goal) {
                await updateGoalProgress(goal, goal.tasks, goal.kpis);
              }
            }
          } catch (error) {
            console.error('Error saving KPI with financial data:', error);
          }
        }
      }
      
      return kpi;
    }));
    
    return updatedKpis;
  } catch (error) {
    console.error('Error connecting KPIs with financial data:', error);
    return kpis; // Return original KPIs on error
  }
};

/**
 * Determine if a KPI is likely related to financial metrics
 * @param {Object} kpi - KPI object to check
 * @returns {Boolean} - True if KPI appears to be financial
 */
const isFinancialKPI = (kpi) => {
  const financialKeywords = [
    'revenue', 'sales', 'profit', 'margin', 'cost', 'expense', 
    'income', 'earnings', 'financial', 'price', 'roi', 'return', 
    'investment', 'cash', 'flow', 'budget', 'spending', 'funding'
  ];
  
  const kpiNameLower = kpi.name.toLowerCase();
  const kpiDescLower = (kpi.description || '').toLowerCase();
  
  // Check if the KPI name or description contains financial keywords
  return financialKeywords.some(keyword => 
    kpiNameLower.includes(keyword) || kpiDescLower.includes(keyword)
  );
};

/**
 * Synchronize financial KPIs with latest financial data
 * @param {Number} userId - User ID for fetching data
 * @returns {Promise<Object>} - Results of the sync operation
 */
const syncFinancialKPIs = async (userId) => {
  try {
    // Get all KPIs for goals created by the user
    const kpis = await KPI.findAll({
      include: [{ 
        model: Goal,
        where: { created_by: userId },
        attributes: ['id', 'title']
      }]
    });
    
    // Update KPIs with financial data
    const updatedKpis = await connectKPIsWithFinancialData(kpis, userId);
    
    return {
      success: true,
      kpisUpdated: updatedKpis.length,
      message: `Successfully synchronized ${updatedKpis.length} KPIs with financial data`
    };
  } catch (error) {
    console.error('Error syncing financial KPIs:', error);
    return {
      success: false,
      message: 'Failed to synchronize KPIs with financial data'
    };
  }
};

module.exports = {
  connectKPIsWithFinancialData,
  isFinancialKPI,
  syncFinancialKPIs
};