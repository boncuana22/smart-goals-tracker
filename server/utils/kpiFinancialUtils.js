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
      limit: 1 // Only get the most recent data
    });
    
    if (!financialData || financialData.length === 0) {
      return kpis; // Return original KPIs if no financial data found
    }
    
    // Get metrics from most recent financial data
    const currentMetrics = financialData[0]?.metrics || [];
    
    // Create a map of current metrics by name for easy lookup
    const metricsMap = {};
    currentMetrics.forEach(metric => {
      metricsMap[metric.metric_name.toLowerCase()] = metric;
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
      // Skip if KPI is not financial type
      if (kpi.kpi_type !== 'financial') {
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
      
      // If we found a matching metric, update ONLY the current value
      if (matchedMetric) {
        console.log(`Updating KPI "${kpi.name}" current value from ${kpi.current_value} to ${matchedMetric.current_value}`);
        
        // ONLY update current value - NEVER touch the target value
        kpi.current_value = matchedMetric.current_value;
        
        // Save updated KPI to database if it's a database model
        if (kpi.save) {
          try {
            await kpi.save();
            console.log(`Saved KPI "${kpi.name}" with new current value: ${kpi.current_value}`);
            
            // Update goal progress if this KPI is linked to a goal
            if (kpi.goal_id) {
              const { updateGoalProgress } = require('./progressCalculator');
              const goal = await Goal.findByPk(kpi.goal_id, {
                include: [
                  { 
                    model: KPI, 
                    as: 'kpis',
                    include: [{ model: Task, as: 'tasks' }]
                  }
                ]
              });
              
              if (goal) {
                await updateGoalProgress(goal, goal.kpis);
              }
            }
          } catch (error) {
            console.error('Error saving KPI with financial data:', error);
          }
        }
      } else {
        console.log(`No matching financial metric found for KPI "${kpi.name}"`);
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
  // Use the explicit kpi_type field if available
  if (kpi.kpi_type) {
    return kpi.kpi_type === 'financial';
  }
  
  // Fallback to keyword detection for legacy KPIs
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
    // Get all financial KPIs for goals created by the user
    const kpis = await KPI.findAll({
      where: { kpi_type: 'financial' }, // Only get financial KPIs
      include: [{ 
        model: Goal,
        where: { created_by: userId },
        attributes: ['id', 'title']
      }]
    });
    
    console.log(`Found ${kpis.length} financial KPIs to sync for user ${userId}`);
    
    // Update KPIs with financial data
    const updatedKpis = await connectKPIsWithFinancialData(kpis, userId);
    
    return {
      success: true,
      kpisUpdated: updatedKpis.length,
      message: `Successfully synchronized ${updatedKpis.length} financial KPIs with latest financial data`
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