const { Task, User, Goal } = require('../models');

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
    
    await task.update({
      title,
      description,
      status,
      priority,
      due_date,
      goal_id
    });
    
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
    
    await task.destroy();
    
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