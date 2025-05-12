const { KPI, Goal, Task } = require('../models');
const { updateGoalProgress } = require('../utils/progressCalculator');

// Obținere toate KPI-urile
exports.getAllKPIs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const kpis = await KPI.findAll({
      include: [{ 
        model: Goal,
        where: { created_by: userId },
        attributes: ['id', 'title']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ kpis });
  } catch (error) {
    console.error('Get all KPIs error:', error);
    res.status(500).json({ message: 'Failed to get KPIs', error: error.message });
  }
};

// Obținere KPI după ID
exports.getKPIById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const kpi = await KPI.findOne({
      where: { id },
      include: [{ 
        model: Goal,
        where: { created_by: userId },
        attributes: ['id', 'title']
      }]
    });
    
    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found' });
    }
    
    res.status(200).json({ kpi });
  } catch (error) {
    console.error('Get KPI by ID error:', error);
    res.status(500).json({ message: 'Failed to get KPI', error: error.message });
  }
};

// Creare KPI nou
exports.createKPI = async (req, res) => {
  try {
    const { name, description, target_value, current_value, unit, goal_id } = req.body;
    const userId = req.user.id;
    
    // Verificare că obiectivul aparține utilizatorului
    const goal = await Goal.findOne({
      where: { id: goal_id, created_by: userId },
      include: [
        { model: Task, as: 'tasks' },
        { model: KPI, as: 'kpis' }
      ]
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found or unauthorized' });
    }
    
    const kpi = await KPI.create({
      name,
      description,
      target_value,
      current_value: current_value || 0,
      unit,
      goal_id
    });
    
    // Update goal progress based on the new KPI
    await updateGoalProgress(goal, goal.tasks, [...goal.kpis, kpi]);
    
    res.status(201).json({ 
      message: 'KPI created successfully', 
      kpi 
    });
  } catch (error) {
    console.error('Create KPI error:', error);
    res.status(500).json({ message: 'Failed to create KPI', error: error.message });
  }
};

// Actualizare KPI
exports.updateKPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, target_value, current_value, unit, goal_id } = req.body;
    const userId = req.user.id;
    
    // Verificare că KPI-ul aparține unui obiectiv al utilizatorului
    const kpi = await KPI.findOne({
      where: { id },
      include: [{ 
        model: Goal,
        where: { created_by: userId }
      }]
    });
    
    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found or unauthorized' });
    }
    
    // Dacă se schimbă goal_id, verifică că noul obiectiv aparține utilizatorului
    if (goal_id && goal_id !== kpi.goal_id) {
      const newGoal = await Goal.findOne({
        where: { id: goal_id, created_by: userId }
      });
      
      if (!newGoal) {
        return res.status(404).json({ message: 'Goal not found or unauthorized' });
      }
    }
    
    // Store the old goal ID and old current value to check if they've changed
    const oldGoalId = kpi.goal_id;
    const oldCurrentValue = kpi.current_value;
    
    await kpi.update({
      name,
      description,
      target_value,
      current_value,
      unit,
      goal_id: goal_id || kpi.goal_id
    });
    
    // If current value changed or goal_id changed, update goal progress
    if (current_value !== oldCurrentValue || goal_id !== oldGoalId) {
      // If KPI was assigned to a goal before update
      if (oldGoalId) {
        const oldGoal = await Goal.findByPk(oldGoalId, {
          include: [
            { model: Task, as: 'tasks' },
            { model: KPI, as: 'kpis' }
          ]
        });
        
        if (oldGoal) {
          // Update old goal progress (without the current KPI if goal changed)
          await updateGoalProgress(
            oldGoal, 
            oldGoal.tasks, 
            oldGoal.kpis.filter(k => k.id !== kpi.id)
          );
        }
      }
      
      // If KPI is assigned to a goal after update
      if (goal_id) {
        const newGoal = await Goal.findByPk(goal_id, {
          include: [
            { model: Task, as: 'tasks' },
            { model: KPI, as: 'kpis' }
          ]
        });
        
        if (newGoal) {
          // Update new goal progress
          // If the KPI is newly assigned to this goal, add it to kpis
          if (goal_id !== oldGoalId) {
            await updateGoalProgress(newGoal, newGoal.tasks, [...newGoal.kpis, kpi]);
          } else {
            // Otherwise update the KPI in newGoal.kpis with the new value
            const kpiIndex = newGoal.kpis.findIndex(k => k.id === kpi.id);
            if (kpiIndex >= 0) {
              newGoal.kpis[kpiIndex].current_value = current_value;
              newGoal.kpis[kpiIndex].target_value = target_value;
            }
            await updateGoalProgress(newGoal, newGoal.tasks, newGoal.kpis);
          }
        }
      }
    }
    
    res.status(200).json({ 
      message: 'KPI updated successfully', 
      kpi 
    });
  } catch (error) {
    console.error('Update KPI error:', error);
    res.status(500).json({ message: 'Failed to update KPI', error: error.message });
  }
};

// Ștergere KPI
exports.deleteKPI = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificare că KPI-ul aparține unui obiectiv al utilizatorului
    const kpi = await KPI.findOne({
      where: { id },
      include: [{ 
        model: Goal,
        where: { created_by: userId }
      }]
    });
    
    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found or unauthorized' });
    }
    
    // Store goal_id before deleting
    const goalId = kpi.goal_id;
    
    await kpi.destroy();
    
    // If KPI was assigned to a goal, update goal progress
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
      message: 'KPI deleted successfully' 
    });
  } catch (error) {
    console.error('Delete KPI error:', error);
    res.status(500).json({ message: 'Failed to delete KPI', error: error.message });
  }
};

// Actualizare valoare curentă KPI
exports.updateKPIValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_value } = req.body;
    const userId = req.user.id;
    
    // Verificare că KPI-ul aparține unui obiectiv al utilizatorului
    const kpi = await KPI.findOne({
      where: { id },
      include: [{ 
        model: Goal,
        where: { created_by: userId }
      }]
    });
    
    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found or unauthorized' });
    }
    
    await kpi.update({ current_value });
    
    // Update goal progress based on the updated KPI
    const goal = await Goal.findByPk(kpi.goal_id, {
      include: [
        { model: Task, as: 'tasks' },
        { model: KPI, as: 'kpis' }
      ]
    });
    
    if (goal) {
      // Update the KPI in goal.kpis with the new value
      const kpiIndex = goal.kpis.findIndex(k => k.id === kpi.id);
      if (kpiIndex >= 0) {
        goal.kpis[kpiIndex].current_value = current_value;
      }
      
      await updateGoalProgress(goal, goal.tasks, goal.kpis);
    }
    
    res.status(200).json({ 
      message: 'KPI value updated successfully', 
      kpi,
      goal
    });
  } catch (error) {
    console.error('Update KPI value error:', error);
    res.status(500).json({ message: 'Failed to update KPI value', error: error.message });
  }
};