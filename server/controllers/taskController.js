const { Task, User, Goal, KPI } = require('../models');
const { updateGoalProgress } = require('../utils/progressCalculator');

// Obținere toate task-urile
exports.getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tasks = await Task.findAll({
      where: { user_id: userId },
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Goal, attributes: ['id', 'title'] },
        { model: KPI, attributes: ['id', 'name', 'kpi_type'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

// Obținere task după ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const task = await Task.findOne({
      where: { id, user_id: userId },
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Goal, attributes: ['id', 'title'] },
        { model: KPI, attributes: ['id', 'name', 'kpi_type'] }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Failed to get task', error: error.message });
  }
};

// Creare task nou
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, due_date, goal_id, kpi_id } = req.body;
    const userId = req.user.id;
    
    // Validare - task-ul trebuie să aibă goal_id sau kpi_id (sau amblele)
    if (!goal_id && !kpi_id) {
      return res.status(400).json({ message: 'Task must be associated with either a goal or a KPI' });
    }
    
    // Dacă e asociat cu un KPI, obține goal_id automat
    let associatedGoalId = goal_id;
    if (kpi_id && !goal_id) {
      const kpi = await KPI.findByPk(kpi_id, {
        include: [{ 
          model: Goal,
          where: { created_by: userId },
          attributes: ['id']
        }]
      });
      
      if (!kpi || !kpi.Goal) {
        return res.status(404).json({ message: 'KPI not found or unauthorized' });
      }
      
      associatedGoalId = kpi.Goal.id;
    }
    
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      due_date,
      user_id: userId,
      goal_id: associatedGoalId,
      kpi_id
    });
    
    // Update goal progress
    if (associatedGoalId) {
      const goal = await Goal.findByPk(associatedGoalId, {
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
    
    res.status(201).json({ 
      message: 'Task created successfully', 
      task 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// Actualizare task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, goal_id, kpi_id } = req.body;
    const userId = req.user.id;
    
    const task = await Task.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Store old values to check if they've changed
    const oldGoalId = task.goal_id;
    const oldKpiId = task.kpi_id;
    const oldStatus = task.status;
    
    // Dacă e asociat cu un KPI nou, obține goal_id automat
    let associatedGoalId = goal_id;
    if (kpi_id && kpi_id !== oldKpiId) {
      const kpi = await KPI.findByPk(kpi_id, {
        include: [{ 
          model: Goal,
          where: { created_by: userId },
          attributes: ['id']
        }]
      });
      
      if (!kpi || !kpi.Goal) {
        return res.status(404).json({ message: 'KPI not found or unauthorized' });
      }
      
      associatedGoalId = kpi.Goal.id;
    }
    
    await task.update({
      title,
      description,
      status,
      priority,
      due_date,
      goal_id: associatedGoalId || task.goal_id,
      kpi_id
    });
    
    // If task status, goal_id, or kpi_id changed, update goal progress
    if (status !== oldStatus || goal_id !== oldGoalId || kpi_id !== oldKpiId) {
      // If task was assigned to a goal before update
      if (oldGoalId) {
        const oldGoal = await Goal.findByPk(oldGoalId, {
          include: [
            { 
              model: KPI, 
              as: 'kpis',
              include: [{ model: Task, as: 'tasks' }]
            }
          ]
        });
        
        if (oldGoal) {
          await updateGoalProgress(oldGoal, oldGoal.kpis);
        }
      }
      
      // If task is assigned to a goal after update
      const newGoalId = associatedGoalId || task.goal_id;
      if (newGoalId && newGoalId !== oldGoalId) {
        const newGoal = await Goal.findByPk(newGoalId, {
          include: [
            { 
              model: KPI, 
              as: 'kpis',
              include: [{ model: Task, as: 'tasks' }]
            }
          ]
        });
        
        if (newGoal) {
          await updateGoalProgress(newGoal, newGoal.kpis);
        }
      }
    }
    
    res.status(200).json({ 
      message: 'Task updated successfully', 
      task 
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// Ștergere task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const task = await Task.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Store goal_id before deleting
    const goalId = task.goal_id;
    
    await task.destroy();
    
    // If task was assigned to a goal, update goal progress
    if (goalId) {
      const goal = await Goal.findByPk(goalId, {
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
    
    res.status(200).json({ 
      message: 'Task deleted successfully' 
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// Obținere task-uri după status
exports.getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user.id;
    
    const tasks = await Task.findAll({
      where: { status, user_id: userId },
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Goal, attributes: ['id', 'title'] },
        { model: KPI, attributes: ['id', 'name', 'kpi_type'] }
      ],
      order: [['due_date', 'ASC']]
    });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

// Actualizare status task
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    const task = await Task.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Store old status
    const oldStatus = task.status;
    
    // Update status
    task.status = status;
    await task.save();
    
    // If status changed and task is linked to a goal, update goal progress
    if (oldStatus !== status && task.goal_id) {
      const goal = await Goal.findByPk(task.goal_id, {
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
    
    res.status(200).json({ 
      message: 'Task status updated successfully', 
      task 
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Failed to update task status', error: error.message });
  }
};

// Obținere task-uri după KPI
exports.getTasksByKPI = async (req, res) => {
  try {
    const { kpiId } = req.params;
    const userId = req.user.id;
    
    // Verifică că KPI-ul aparține utilizatorului
    const kpi = await KPI.findOne({
      where: { id: kpiId },
      include: [{
        model: Goal,
        where: { created_by: userId }
      }]
    });
    
    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found or unauthorized' });
    }
    
    // Obține toate task-urile asociate acestui KPI
    const tasks = await Task.findAll({
      where: { kpi_id: kpiId, user_id: userId },
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Goal, attributes: ['id', 'title'] },
        { model: KPI, attributes: ['id', 'name', 'kpi_type'] }
      ],
      order: [['due_date', 'ASC']]
    });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks by KPI error:', error);
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

// Obținere task-uri după Goal
exports.getTasksByGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.id;
    
    // Verifică că goal-ul aparține utilizatorului
    const goal = await Goal.findOne({
      where: { id: goalId, created_by: userId }
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found or unauthorized' });
    }
    
    // Obține toate task-urile asociate acestui goal
    const tasks = await Task.findAll({
      where: { goal_id: goalId, user_id: userId },
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Goal, attributes: ['id', 'title'] },
        { model: KPI, attributes: ['id', 'name', 'kpi_type'] }
      ],
      order: [['due_date', 'ASC']]
    });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks by goal error:', error);
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};