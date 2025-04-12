import React, { useState, useEffect } from 'react';
import './TaskForm.css';

const TaskForm = ({ task, onSubmit, onCancel, goals }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    due_date: '',
    goal_id: ''
  });

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
        goal_id: task.goal_id || ''
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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

        <div className="form-row">
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

          <div className="form-group">
            <label htmlFor="goal_id">Related Goal</label>
            <select
              id="goal_id"
              name="goal_id"
              value={formData.goal_id}
              onChange={handleChange}
              className="form-control"
            >
              <option value="">None</option>
              {goals && goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
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