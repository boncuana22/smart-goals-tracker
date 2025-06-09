import React, { useState, useEffect } from 'react';
import './TaskForm.css';
import goalService from '../../api/goalService';

const TaskForm = ({ task, onSubmit, onCancel, goals }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    due_date: '',
    goal_id: '',
    kpi_id: ''
  });

  const [availableKPIs, setAvailableKPIs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      // Format date for HTML date input
      let formattedDate = '';
      if (task.due_date) {
        const date = new Date(task.due_date);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        due_date: formattedDate,
        goal_id: task.goal_id || '',
        kpi_id: task.kpi_id || ''
      });

      // If editing a task with a goal, load that goal's KPIs
      if (task.goal_id) {
        loadGoalKPIs(task.goal_id);
      }
    }
  }, [task]);

  const loadGoalKPIs = async (goalId) => {
    if (!goalId) {
      setAvailableKPIs([]);
      return;
    }

    setLoading(true);
    try {
      const response = await goalService.getGoalById(goalId);
      if (response.goal) {
        // Filter for operational KPIs only (financial KPIs don't need tasks)
        const operationalKPIs = (response.goal.kpis || []).filter(kpi => kpi.kpi_type === 'operational');
        setAvailableKPIs(operationalKPIs);
      }
    } catch (error) {
      console.error('Error loading goal KPIs:', error);
      setAvailableKPIs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'goal_id') {
      setFormData({ ...formData, goal_id: value, kpi_id: '' }); // Reset KPI when goal changes
      loadGoalKPIs(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const cleanedFormData = {
      ...formData,
      kpi_id: formData.kpi_id && formData.kpi_id.trim() !== '' ? formData.kpi_id : null,
      description: formData.description && formData.description.trim() !== '' ? formData.description : null,
      due_date: formData.due_date && formData.due_date.trim() !== '' ? formData.due_date : null
    };
    
    onSubmit(cleanedFormData);
  };

  return (
    <div className="task-form-container">
      <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-control"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-control"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="due_date">Due Date</label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-section">
          <h3>Assignment</h3>
          <p className="form-helper">
            Choose how this task contributes to your goals. Tasks assigned to operational KPIs will automatically update the KPI's progress.
          </p>
          
          <div className="form-group">
            <label htmlFor="goal_id">Related Goal</label>
            <select
              id="goal_id"
              name="goal_id"
              value={formData.goal_id}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select a goal...</option>
              {goals && goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          {formData.goal_id && (
            <div className="form-group">
              <label htmlFor="kpi_id">Specific KPI (Optional)</label>
              <select
                id="kpi_id"
                name="kpi_id"
                value={formData.kpi_id}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              >
                <option value="">General goal task</option>
                {availableKPIs.map(kpi => (
                  <option key={kpi.id} value={kpi.id}>
                    📊 {kpi.name}
                  </option>
                ))}
              </select>
              
              {loading && <div className="form-helper">Loading KPIs...</div>}
              
              {!loading && availableKPIs.length === 0 && formData.goal_id && (
                <div className="form-helper">
                  This goal has no operational KPIs. The task will be assigned to the goal directly.
                </div>
              )}
              
              {availableKPIs.length > 0 && (
                <div className="form-helper">
                  💡 <strong>Tip:</strong> Assign to a specific KPI if this task directly contributes to that measurement. 
                  Leave as "General goal task" if it supports the goal broadly.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;