const { Goal, Task, KPI, User, TeamMember } = require('../models');
const { Op } = require('sequelize');
const { updateGoalProgress } = require('../utils/progressCalculator');

// Obținere toate obiectivele
exports.getAllGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Găsește toate echipele utilizatorului
    const userTeams = await TeamMember.findAll({
      where: { user_id: userId },
      attributes: ['team_id']
    });
    
    const teamIds = userTeams.map(tm => tm.team_id);
    
    // Include goal-urile create de user + goal-urile echipelor
    const whereClause = {
      [Op.or]: [
        { created_by: userId },  // Goal-urile create de user
        { team_id: { [Op.in]: teamIds } }  // Goal-urile echipelor
      ]
    };
    
    const goals = await Goal.findAll({
      where: whereClause,
      include: [
        { 
          model: Task, 
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'kpi_id'] 
        },
        { 
          model: KPI, 
          as: 'kpis',
          attributes: ['id', 'name', 'current_value', 'target_value', 'unit', 'weight_in_goal', 'kpi_type'],
          include: [
            {
              model: Task,
              as: 'tasks',
              attributes: ['id', 'title', 'status', 'due_date']
            }
          ]
        },
        {
          model: User,
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ goals });
  } catch (error) {
    console.error('Get all goals error:', error);
    res.status(500).json({ message: 'Failed to get goals', error: error.message });
  }
};

// Obținere obiectiv după ID
exports.getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verifică dacă goal-ul aparține utilizatorului sau unei echipe din care face parte
    const userTeams = await TeamMember.findAll({
      where: { user_id: userId },
      attributes: ['team_id']
    });
    
    const teamIds = userTeams.map(tm => tm.team_id);
    
    const whereClause = {
      id,
      [Op.or]: [
        { created_by: userId },
        { team_id: { [Op.in]: teamIds } }
      ]
    };
    
    const goal = await Goal.findOne({
      where: whereClause,
      include: [
        { 
          model: Task, 
          as: 'tasks',
          include: [{ model: User, attributes: ['id', 'username'] }]
        },
        { 
          model: KPI, 
          as: 'kpis',
          include: [
            {
              model: Task,
              as: 'tasks',
              attributes: ['id', 'title', 'status', 'due_date', 'priority']
            }
          ]
        },
        {
          model: User,
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.status(200).json({ goal });
  } catch (error) {
    console.error('Get goal by ID error:', error);
    res.status(500).json({ message: 'Failed to get goal', error: error.message });
  }
};

// Creare obiectiv nou
exports.createGoal = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      specific_details, 
      measurable_metrics, 
      achievable_factors, 
      relevant_reasoning, 
      time_bound_date,
      status,
      progress,
      team_id
    } = req.body;
    
    const userId = req.user.id;
    
    const goal = await Goal.create({
      title, 
      description, 
      specific_details, 
      measurable_metrics, 
      achievable_factors, 
      relevant_reasoning, 
      time_bound_date,
      status: status || 'Not Started',
      progress: progress || 0,
      team_id, 
      created_by: userId
    });
    
    res.status(201).json({ 
      message: 'Goal created successfully', 
      goal 
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Failed to create goal', error: error.message });
  }
};

// Actualizare obiectiv
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      specific_details, 
      measurable_metrics, 
      achievable_factors, 
      relevant_reasoning, 
      time_bound_date,
      status,
      progress,
      team_id
    } = req.body;
    
    const userId = req.user.id;
    
    const goal = await Goal.findOne({ 
      where: { id, created_by: userId } 
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    await goal.update({
      title, 
      description, 
      specific_details, 
      measurable_metrics, 
      achievable_factors, 
      relevant_reasoning, 
      time_bound_date,
      status,
      progress,
      team_id
    });
    
    res.status(200).json({ 
      message: 'Goal updated successfully', 
      goal 
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Failed to update goal', error: error.message });
  }
};

// Ștergere obiectiv
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const goal = await Goal.findOne({ 
      where: { id, created_by: userId } 
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    await goal.destroy();
    
    res.status(200).json({ 
      message: 'Goal deleted successfully' 
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Failed to delete goal', error: error.message });
  }
};

// Actualizare progres obiectiv
exports.updateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    const userId = req.user.id;
    
    const goal = await Goal.findOne({ 
      where: { id, created_by: userId } 
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Actualizare progres și posibil status
    let updatedStatus = status;
    if (!updatedStatus) {
      if (progress === 100) {
        updatedStatus = 'Completed';
      } else if (progress > 0) {
        updatedStatus = 'In Progress';
      }
    }
    
    await goal.update({
      progress,
      status: updatedStatus || goal.status
    });
    
    res.status(200).json({ 
      message: 'Goal progress updated', 
      goal 
    });
  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({ message: 'Failed to update goal progress', error: error.message });
  }
};

// Adăugăm o funcție pentru recalcularea automată a progresului
exports.recalculateGoalProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Obține goal-ul cu toate KPI-urile și task-urile lor
    const goal = await Goal.findOne({
      where: { id, created_by: userId },
      include: [
        { 
          model: KPI, 
          as: 'kpis',
          include: [
            {
              model: Task,
              as: 'tasks',
              attributes: ['id', 'title', 'status', 'due_date']
            }
          ]
        }
      ]
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Recalculează progresul bazat pe KPI-uri
    await updateGoalProgress(goal, goal.kpis);
    
    res.status(200).json({ 
      message: 'Goal progress recalculated successfully',
      goal: {
        id: goal.id,
        progress: goal.progress,
        status: goal.status
      }
    });
  } catch (error) {
    console.error('Recalculate goal progress error:', error);
    res.status(500).json({ message: 'Failed to recalculate goal progress', error: error.message });
  }
};