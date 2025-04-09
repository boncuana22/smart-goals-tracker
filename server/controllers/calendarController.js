const { CalendarEvent, Task, Goal } = require('../models');
const { Op } = require('sequelize');

// Obținere toate evenimentele
exports.getAllEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const events = await CalendarEvent.findAll({
      where: { user_id: userId },
      order: [['start_date', 'ASC']]
    });
    
    res.status(200).json({ events });
  } catch (error) {
    console.error('Get all calendar events error:', error);
    res.status(500).json({ message: 'Failed to get calendar events', error: error.message });
  }
};

// Obținere evenimente într-un interval de timp
exports.getEventsByRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    const userId = req.user.id;
    
    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }
    
    const events = await CalendarEvent.findAll({
      where: { 
        user_id: userId,
        [Op.or]: [
          {
            start_date: {
              [Op.between]: [new Date(start), new Date(end)]
            }
          },
          {
            end_date: {
              [Op.between]: [new Date(start), new Date(end)]
            }
          },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: new Date(start) } },
              { end_date: { [Op.gte]: new Date(end) } }
            ]
          }
        ]
      },
      order: [['start_date', 'ASC']]
    });
    
    res.status(200).json({ events });
  } catch (error) {
    console.error('Get calendar events by range error:', error);
    res.status(500).json({ message: 'Failed to get calendar events', error: error.message });
  }
};

// Creare eveniment nou
exports.createEvent = async (req, res) => {
  try {
    const { title, description, start_date, end_date, event_type, related_id } = req.body;
    const userId = req.user.id;
    
    // Validare date
    if (!start_date) {
      return res.status(400).json({ message: 'Start date is required' });
    }
    
    const event = await CalendarEvent.create({
      title,
      description,
      start_date,
      end_date,
      event_type: event_type || 'Other',
      related_id,
      user_id: userId
    });
    
    res.status(201).json({ 
      message: 'Event created successfully', 
      event 
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// Actualizare eveniment
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_date, end_date, event_type, related_id } = req.body;
    const userId = req.user.id;
    
    const event = await CalendarEvent.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Validare date
    if (!start_date) {
      return res.status(400).json({ message: 'Start date is required' });
    }
    
    await event.update({
      title,
      description,
      start_date,
      end_date,
      event_type,
      related_id
    });
    
    res.status(200).json({ 
      message: 'Event updated successfully', 
      event 
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

// Ștergere eveniment
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const event = await CalendarEvent.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    await event.destroy();
    
    res.status(200).json({ 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

// Sincronizare evenimente cu task-uri și obiective
exports.syncEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    let createdEvents = 0;
    
    // Sincronizare task-uri
    const tasks = await Task.findAll({
      where: { 
        user_id: userId,
        due_date: { [Op.ne]: null }
      }
    });
    
    for (const task of tasks) {
      // Verifică dacă există deja un eveniment pentru acest task
      const existingEvent = await CalendarEvent.findOne({
        where: {
          user_id: userId,
          event_type: 'Task',
          related_id: task.id
        }
      });
      
      if (!existingEvent) {
        // Creează un nou eveniment pentru task
        await CalendarEvent.create({
          title: `Task: ${task.title}`,
          description: task.description,
          start_date: task.due_date,
          end_date: task.due_date,
          event_type: 'Task',
          related_id: task.id,
          user_id: userId
        });
        
        createdEvents++;
      }
    }
    
    // Sincronizare obiective
    const goals = await Goal.findAll({
      where: { 
        created_by: userId,
        time_bound_date: { [Op.ne]: null }
      }
    });
    
    for (const goal of goals) {
      // Verifică dacă există deja un eveniment pentru acest obiectiv
      const existingEvent = await CalendarEvent.findOne({
        where: {
          user_id: userId,
          event_type: 'Goal',
          related_id: goal.id
        }
      });
      
      if (!existingEvent) {
        // Creează un nou eveniment pentru obiectiv
        await CalendarEvent.create({
          title: `Goal: ${goal.title}`,
          description: goal.description,
          start_date: goal.time_bound_date,
          end_date: goal.time_bound_date,
          event_type: 'Goal',
          related_id: goal.id,
          user_id: userId
        });
        
        createdEvents++;
      }
    }
    
    res.status(200).json({ 
      message: `Calendar synchronized successfully. Created ${createdEvents} new events.` 
    });
  } catch (error) {
    console.error('Sync calendar events error:', error);
    res.status(500).json({ message: 'Failed to synchronize calendar', error: error.message });
  }
};