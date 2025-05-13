/**
 * Calculate progress for a single KPI based on its type and associated tasks
 * @param {Object} kpi - KPI object with tasks loaded
 * @returns {number} - Progress percentage (0-100)
 */
const calculateKPIProgress = (kpi) => {
    if (kpi.kpi_type === 'operational') {
      // For operational KPIs, calculate from associated tasks only
      const tasks = kpi.tasks || [];
      if (tasks.length === 0) return 0;
      
      let totalProgress = 0;
      tasks.forEach(task => {
        if (task.status === 'Completed') {
          totalProgress += 100;
        } else if (task.status === 'In Progress') {
          totalProgress += 50;
        }
        // 'To Do' adds 0
      });
      
      return Math.round(totalProgress / tasks.length);
    } else if (kpi.kpi_type === 'financial') {
      // For financial KPIs, combine financial and task progress
      let financialProgress = 0;
      let taskProgress = 0;
      
      // Calculate financial progress (current/target ratio)
      if (kpi.target_value && kpi.target_value > 0) {
        financialProgress = Math.min(100, (kpi.current_value / kpi.target_value) * 100);
      }
      
      // Calculate task progress (if any tasks)
      const tasks = kpi.tasks || [];
      if (tasks.length > 0) {
        let totalTaskProgress = 0;
        tasks.forEach(task => {
          if (task.status === 'Completed') {
            totalTaskProgress += 100;
          } else if (task.status === 'In Progress') {
            totalTaskProgress += 50;
          }
        });
        taskProgress = totalTaskProgress / tasks.length;
      }
      
      // Combine financial and task progress based on weights
      const financialWeight = kpi.financial_progress_weight / 100;
      const taskWeight = kpi.tasks_progress_weight / 100;
      
      const combinedProgress = (financialProgress * financialWeight) + (taskProgress * taskWeight);
      return Math.round(combinedProgress);
    }
    
    return 0;
  };
  
  /**
   * Update goal progress based on KPIs with their weights
   * @param {Object} goal - Goal object to update
   * @param {Array} kpis - Array of KPI objects with tasks loaded
   * @returns {Object} - Updated goal with progress and status
   */
  const updateGoalProgress = async (goal, kpis) => {
    // Skip if goal is manually set to "On Hold" or "Completed"
    if (goal.status === 'On Hold' || goal.status === 'Completed') {
      return goal;
    }
    
    if (kpis.length === 0) {
      return goal;
    }
    
    let totalProgress = 0;
    let totalWeight = 0;
    
    // Calculate weighted average of KPI progress
    kpis.forEach(kpi => {
      const kpiProgress = calculateKPIProgress(kpi);
      const weight = kpi.weight_in_goal || 0;
      
      totalProgress += kpiProgress * (weight / 100);
      totalWeight += weight;
    });
    
    // If weights don't add up to 100%, normalize or use equal weights
    let finalProgress;
    if (totalWeight === 0) {
      // Equal weights for all KPIs
      let avgProgress = 0;
      kpis.forEach(kpi => {
        avgProgress += calculateKPIProgress(kpi);
      });
      finalProgress = Math.round(avgProgress / kpis.length);
    } else if (totalWeight !== 100) {
      // Normalize to 100%
      finalProgress = Math.round((totalProgress / totalWeight) * 100);
    } else {
      finalProgress = Math.round(totalProgress);
    }
    
    // Determine status based on progress
    let status = 'Not Started';
    if (finalProgress === 100) {
      status = 'Completed';
    } else if (finalProgress > 0) {
      status = 'In Progress';
    }
    
    // Update goal properties
    goal.progress = finalProgress;
    goal.status = status;
    
    // Save updated goal
    if (goal.save) {
      try {
        await goal.save();
      } catch (error) {
        console.error('Error saving goal progress:', error);
      }
    }
    
    return goal;
  };
  
  module.exports = {
    calculateKPIProgress,
    calculateGoalProgress: (kpis) => {
      // This function is now simplified - just call updateGoalProgress with a mock goal
      const mockGoal = { status: 'In Progress' };
      const result = updateGoalProgress(mockGoal, kpis);
      return { progress: result.progress, status: result.status };
    },
    updateGoalProgress
  };