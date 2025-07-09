// Calculate progress as percentage of completed tasks
export function calculateGoalProgress(goal) {
  if (!goal || !Array.isArray(goal.tasks) || goal.tasks.length === 0) return 0;
  const completed = goal.tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completed / goal.tasks.length) * 100);
}

// Check if all tasks are completed AND all KPIs are achieved
export function isGoalCompleted(goal) {
  if (!goal) return false;
  const allTasksCompleted = Array.isArray(goal.tasks) && goal.tasks.length > 0
    ? goal.tasks.every(task => task.status === 'Completed')
    : false;
  const allKPIsAchieved = Array.isArray(goal.kpis) && goal.kpis.length > 0
    ? goal.kpis.every(kpi => kpi.is_achieved === true)
    : false;
  // At least one of tasks or kpis must exist and be fully completed/achieved
  if ((Array.isArray(goal.tasks) && goal.tasks.length > 0) || (Array.isArray(goal.kpis) && goal.kpis.length > 0)) {
    return allTasksCompleted && allKPIsAchieved;
  }
  return false;
} 