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
        { model: Goal, attributes: ['id', 'title'] }
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
        { model: Goal, attributes: ['id', 'title'] }
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
    const { title, description, status, priority, due_date, goal_id } = req.body;
    const userId = req.user.id;
    
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      due_date,
      user_id: userId,
      goal_id
    });
    
    // If task is linked to a goal, update goal progress
    if (goal_id) {
      const goal = await Goal.findByPk(goal_id, {
        include: [
          { model: Task, as: 'tasks' },
          { model: KPI, as: 'kpis' }
        ]
      });
      
      if (goal) {
        // Update goal progress based on tasks
        await updateGoalProgress(goal, [...goal.tasks, task], goal.kpis);
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
    const { title, description, status, priority, due_date, goal_id } = req.body;
    const userId = req.user.id;
    
    const task = await Task.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Store old goal ID and status to check if they've changed
    const oldGoalId = task.goal_id;
    const oldStatus = task.status;
    
    await task.update({
      title,
      description,
      status,
      priority,
      due_date,
      goal_id
    });
    
    // If task status changed or goal_id changed, update goal progress
    if (status !== oldStatus || goal_id !== oldGoalId) {
      // If task was assigned to a goal before update
      if (oldGoalId) {
        const oldGoal = await Goal.findByPk(oldGoalId, {
          include: [
            { model: Task, as: 'tasks' },
            { model: KPI, as: 'kpis' }
          ]
        });
        
        if (oldGoal) {
          // Update old goal progress (without the current task if goal changed)
          await updateGoalProgress(
            oldGoal, 
            oldGoal.tasks.filter(t => t.id !== task.id), 
            oldGoal.kpis
          );
        }
      }
      
      // If task is assigned to a goal after update
      if (goal_id) {
        const newGoal = await Goal.findByPk(goal_id, {
          include: [
            { model: Task, as: 'tasks' },
            { model: KPI, as: 'kpis' }
          ]
        });
        
        if (newGoal) {
          // Update new goal progress
          // If the task is newly assigned to this goal, add it to tasks
          if (goal_id !== oldGoalId) {
            await updateGoalProgress(newGoal, [...newGoal.tasks, task], newGoal.kpis);
          } else {
            // Otherwise the task is already in newGoal.tasks
            await updateGoalProgress(newGoal, newGoal.tasks, newGoal.kpis);
          }
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
          { model: Task, as: 'tasks' },
          { model: KPI, as: 'kpis' }
        ]
      });
      
      if (goal) {
        await updateGoalProgress(goal, goal.tasks, goal.kpis);
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
        { model: Goal, attributes: ['id', 'title'] }
      ],
      order: [['due_date', 'ASC']]
    });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

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
          { model: Task, as: 'tasks' },
          { model: KPI, as: 'kpis' }
        ]
      });
      
      if (goal) {
        // Find task in goal.tasks and update its status
        const taskIndex = goal.tasks.findIndex(t => t.id === task.id);
        if (taskIndex >= 0) {
          goal.tasks[taskIndex].status = status;
        }
        
        await updateGoalProgress(goal, goal.tasks, goal.kpis);
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