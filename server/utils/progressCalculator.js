/**
 * Utility functions for calculating progress of goals and KPIs
 */

/**
 * Calculate goal progress based on tasks
 * @param {Array} tasks - Array of task objects associated with a goal
 * @param {Array} kpis - Array of KPI objects associated with a goal
 * @returns {Object} - Object containing progress percentage and status
 */
const calculateGoalProgress = (tasks = [], kpis = []) => {
    let progressValue = 0;
    let statusValue = 'Not Started';
    
    // Calculate task-based progress
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(task => task.status === 'Completed').length;
      const taskProgress = Math.round((completedTasks / tasks.length) * 100);
      
      // Task progress weighting
      progressValue += taskProgress * 0.7; // Tasks contribute 70% to overall progress
    }
    
    // Calculate KPI-based progress
    if (kpis.length > 0) {
      let kpiProgressSum = 0;
      
      kpis.forEach(kpi => {
        if (kpi.target_value && kpi.target_value > 0) {
          // Calculate percentage progress toward target
          const kpiProgress = Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100));
          kpiProgressSum += kpiProgress;
        }
      });
      
      const avgKpiProgress = kpiProgressSum / kpis.length;
      
      // KPI progress weighting
      progressValue += avgKpiProgress * 0.3; // KPIs contribute 30% to overall progress
    } else if (tasks.length === 0) {
      // If no tasks and no KPIs, use goal's original progress
      return null; // Return null to indicate no automatic calculation
    }
    
    // Round to nearest integer
    progressValue = Math.round(progressValue);
    
    // Determine status based on progress
    if (progressValue === 100) {
      statusValue = 'Completed';
    } else if (progressValue > 0) {
      statusValue = 'In Progress';
    }
    
    return {
      progress: progressValue,
      status: statusValue
    };
  };
  
  /**
   * Update goal progress based on tasks and KPIs
   * @param {Object} goal - Goal object to update
   * @param {Array} tasks - Array of task objects
   * @param {Array} kpis - Array of KPI objects
   * @returns {Object} - Updated goal with progress and status
   */
  const updateGoalProgress = async (goal, tasks, kpis) => {
    // Skip if goal is manually set to "On Hold" or "Completed"
    if (goal.status === 'On Hold' || goal.status === 'Completed') {
      return goal;
    }
    
    // Calculate new progress and status
    const progressData = calculateGoalProgress(tasks, kpis);
    
    // If no progress calculation possible, return unchanged goal
    if (!progressData) {
      return goal;
    }
    
    // Update goal properties
    goal.progress = progressData.progress;
    goal.status = progressData.status;
    
    // Save updated goal (assuming goal is a Sequelize model instance)
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
    calculateGoalProgress,
    updateGoalProgress
  };