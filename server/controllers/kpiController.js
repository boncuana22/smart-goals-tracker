const { KPI, Goal } = require('../models');

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
      where: { id: goal_id, created_by: userId }
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
    
    await kpi.update({
      name,
      description,
      target_value,
      current_value,
      unit,
      goal_id: goal_id || kpi.goal_id
    });
    
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
    
    await kpi.destroy();
    
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
    
    // Calculare progres obiectiv dacă target_value există
    if (kpi.target_value > 0) {
      const progress = Math.min(100, Math.round((current_value / kpi.target_value) * 100));
      
      // Actualizare progres obiectiv
      const goal = await Goal.findByPk(kpi.goal_id);
      if (goal) {
        let status = goal.status;
        if (progress === 100) {
          status = 'Completed';
        } else if (progress > 0) {
          status = 'In Progress';
        }
        
        await goal.update({ progress, status });
      }
    }
    
    res.status(200).json({ 
      message: 'KPI value updated successfully', 
      kpi,
      goal: kpi.Goal
    });
  } catch (error) {
    console.error('Update KPI value error:', error);
    res.status(500).json({ message: 'Failed to update KPI value', error: error.message });
  }
};