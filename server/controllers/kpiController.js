const { KPI, Goal, Task } = require('../models');
const { updateGoalProgress } = require('../utils/progressCalculator');

// Obținere toate KPI-urile
exports.getAllKPIs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const kpis = await KPI.findAll({
      include: [
        { 
          model: Goal,
          where: { created_by: userId },
          attributes: ['id', 'title']
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'due_date', 'priority'],
          include: [
            { 
              model: User, 
              as: 'assignedUser',  
              attributes: ['id', 'username'] 
            }
          ]
        }
      ],
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
      include: [
        { 
          model: Goal,
          where: { created_by: userId },
          attributes: ['id', 'title']
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'title', 'status', 'due_date', 'priority'],
          include: [
            { 
              model: User, 
              as: 'assignedUser', 
              attributes: ['id', 'username'] 
            }
          ]
        }
      ]
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
    const { 
      name, 
      description, 
      target_value, 
      current_value, 
      unit, 
      goal_id,
      // Câmpuri noi pentru ponderi
      weight_in_goal,
      kpi_type,
      financial_progress_weight,
      tasks_progress_weight
    } = req.body;
    
    const userId = req.user.id;
    
    // Verifică că procentajele sunt valide pentru KPI-urile financiare
    if (kpi_type === 'financial') {
      const fin_weight = parseFloat(financial_progress_weight || 100);
      const task_weight = parseFloat(tasks_progress_weight || 0);
      const totalWeight = fin_weight + task_weight;
      
      if (Math.abs(totalWeight - 100) > 0.01) { // Allow for small floating point errors
        return res.status(400).json({ 
          message: 'Financial and tasks progress weights must add up to 100%' 
        });
      }
    }
    
    // Verificare că obiectivul aparține utilizatorului
    const goal = await Goal.findOne({
      where: { id: goal_id, created_by: userId },
      include: [
        { 
          model: KPI, 
          as: 'kpis',
          include: [{ model: Task, as: 'tasks' }]
        }
      ]
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found or unauthorized' });
    }
    
    // Verifică că suma ponderilor în goal nu depășește 100%
    const existingWeightsSum = goal.kpis.reduce((sum, kpi) => sum + (parseFloat(kpi.weight_in_goal) || 0), 0);
    const newWeight = parseFloat(weight_in_goal || 0);
    
    if (existingWeightsSum + newWeight > 100) {
      return res.status(400).json({ 
        message: `Total weight would exceed 100%. Current total: ${existingWeightsSum}%, trying to add: ${newWeight}%` 
      });
    }
    
    // --- LOGICĂ is_achieved ---
    let is_achieved = false;
    if (kpi_type === 'operational') {
      is_achieved = req.body.is_achieved === true;
    } else if (kpi_type === 'financial') {
      if (target_value && current_value >= target_value) {
        is_achieved = true;
      } else {
        is_achieved = req.body.is_achieved === true; // opțional, permite și manual
      }
    }
    
    const kpi = await KPI.create({
      name,
      description: description || null,
      target_value: target_value && target_value !== '' ? target_value : null,
      current_value: current_value && current_value !== '' ? current_value : 0,
      unit: unit || null,
      goal_id,
      weight_in_goal: weight_in_goal || 0,
      kpi_type: kpi_type || 'operational',
      financial_progress_weight: financial_progress_weight || 100,
      tasks_progress_weight: tasks_progress_weight || 0,
      is_achieved // <-- nou
    });
    
    // Reload goal with updated KPIs
    const updatedGoal = await Goal.findByPk(goal_id, {
      include: [
        { 
          model: KPI, 
          as: 'kpis',
          include: [{ model: Task, as: 'tasks' }]
        }
      ]
    });
    
    // Update goal progress based on the new KPI
    await updateGoalProgress(updatedGoal, updatedGoal.kpis);
    
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
    const { 
      name, 
      description, 
      target_value, 
      current_value, 
      unit, 
      goal_id,
      // Câmpuri noi pentru ponderi
      weight_in_goal,
      kpi_type,
      financial_progress_weight,
      tasks_progress_weight
    } = req.body;
    
    const userId = req.user.id;
    
    // Verifică că procentajele sunt valide pentru KPI-urile financiare
    if (kpi_type === 'financial') {
      const fin_weight = parseFloat(financial_progress_weight || 100);
      const task_weight = parseFloat(tasks_progress_weight || 0);
      const totalWeight = fin_weight + task_weight;
      
      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({ 
          message: 'Financial and tasks progress weights must add up to 100%' 
        });
      }
    }
    
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
    
    // Verifică că suma ponderilor în goal nu depășește 100%
    const goalToCheck = goal_id || kpi.goal_id;
    const goalWithKpis = await Goal.findByPk(goalToCheck, {
      include: [{ model: KPI, as: 'kpis' }]
    });
    
    if (goalWithKpis) {
      const existingWeightsSum = goalWithKpis.kpis
        .filter(k => k.id !== kpi.id) // Exclude current KPI
        .reduce((sum, k) => sum + (parseFloat(k.weight_in_goal) || 0), 0);
      
      const newWeight = parseFloat(weight_in_goal || kpi.weight_in_goal || 0);
      
      if (existingWeightsSum + newWeight > 100) {
        return res.status(400).json({ 
          message: `Total weight would exceed 100%. Current total (excluding this KPI): ${existingWeightsSum}%, trying to set: ${newWeight}%` 
        });
      }
    }
    
    // --- LOGICĂ is_achieved LA UPDATE ---
    let updatedIsAchieved = kpi.is_achieved;
    if (kpi_type === 'operational') {
      updatedIsAchieved = req.body.is_achieved === true;
    } else if (kpi_type === 'financial') {
      if (target_value && current_value >= target_value) {
        updatedIsAchieved = true;
      } else {
        updatedIsAchieved = req.body.is_achieved === true;
      }
    }
    
    // Store the old values
    const oldGoalId = kpi.goal_id;
    const oldCurrentValue = kpi.current_value;
    const oldWeightInGoal = kpi.weight_in_goal;
    const oldKpiType = kpi.kpi_type;
    
    await kpi.update({
      name,
      description: description || null,
      target_value: target_value && target_value !== '' ? target_value : null,
      current_value: current_value && current_value !== '' ? current_value : kpi.current_value,
      unit: unit || null,
      goal_id: goal_id || kpi.goal_id,
      weight_in_goal: weight_in_goal !== undefined ? weight_in_goal : kpi.weight_in_goal,
      kpi_type: kpi_type || kpi.kpi_type,
      financial_progress_weight: financial_progress_weight !== undefined ? financial_progress_weight : kpi.financial_progress_weight,
      tasks_progress_weight: tasks_progress_weight !== undefined ? tasks_progress_weight : kpi.tasks_progress_weight,
      is_achieved: updatedIsAchieved // <-- nou
    });
    
    // If significant values changed, update goal progress
    if (current_value !== oldCurrentValue || goal_id !== oldGoalId || 
        weight_in_goal !== oldWeightInGoal || kpi_type !== oldKpiType) {
      
      // If KPI was assigned to a goal before update
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
      
      // If KPI is assigned to a goal after update
      const newGoalId = goal_id || kpi.goal_id;
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
    const { current_value, is_achieved } = req.body;
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

    // Update current_value and/or is_achieved if present
    const updateFields = {};
    if (current_value !== undefined) updateFields.current_value = current_value;
    if (is_achieved !== undefined) updateFields.is_achieved = is_achieved;
    await kpi.update(updateFields);

    // Update goal progress based on the updated KPI
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

    res.status(200).json({ 
      message: 'KPI value updated successfully', 
      kpi,
      goal: goal ? {
        id: goal.id,
        progress: goal.progress,
        status: goal.status
      } : null
    });
  } catch (error) {
    console.error('Update KPI value error:', error);
    res.status(500).json({ message: 'Failed to update KPI value', error: error.message });
  }
};

// Recalculare progres KPI
exports.recalculateKPIProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Găsește KPI-ul cu task-urile lui
    const kpi = await KPI.findOne({
      where: { id },
      include: [
        { 
          model: Goal,
          where: { created_by: userId }
        },
        {
          model: Task,
          as: 'tasks'
        }
      ]
    });
    
    if (!kpi) {
      return res.status(404).json({ message: 'KPI not found or unauthorized' });
    }
    
    // Recalculează progresul goal-ului la care aparține acest KPI
    const goal = await Goal.findByPk(kpi.Goal.id, {
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
    
    res.status(200).json({ 
      message: 'KPI progress recalculated successfully',
      goal: goal ? {
        id: goal.id,
        progress: goal.progress,
        status: goal.status
      } : null
    });
  } catch (error) {
    console.error('Recalculate KPI progress error:', error);
    res.status(500).json({ message: 'Failed to recalculate KPI progress', error: error.message });
  }
};