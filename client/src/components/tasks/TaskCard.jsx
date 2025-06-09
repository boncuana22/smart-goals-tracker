import React from 'react';
import './TaskCard.css';
import { Warning, CalendarToday, Edit, Delete } from '@mui/icons-material';

const priorityColors = {
  'Low': '#4caf50',    // Green
  'Medium': '#ff9800', // Orange
  'High': '#f44336'    // Red
};

const TaskCard = ({ task, onEdit, onDelete, onDragStart }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', task.id);
    if (onDragStart) onDragStart(task);
  };

  // Format date pentru afișare
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Verificare dacă task-ul este overdue
  const isOverdue = () => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== 'Completed';
  };

  return (
    <div 
      className={`task-card ${isOverdue() ? 'overdue' : ''}`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div 
          className="priority-indicator"
          style={{ backgroundColor: priorityColors[task.priority] }}
        >
          {task.priority}
        </div>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      <div className="task-footer">
        <div className="task-due-date">
          {isOverdue() ? (
            <Warning sx={{ fontSize: 16, color: '#f44336', marginRight: '4px', verticalAlign: 'middle' }} />
          ) : (
            <CalendarToday sx={{ fontSize: 16, color: '#666', marginRight: '4px', verticalAlign: 'middle' }} />
          )}
          {formatDate(task.due_date)}
        </div>
        
        <div className="task-actions">
          <button 
            className="edit-btn"
            onClick={() => onEdit(task)}
            title="Edit Task"
          >
            <Edit sx={{ fontSize: 16 }} />
          </button>
          <button 
            className="delete-btn"
            onClick={() => onDelete(task.id)}
            title="Delete Task"
          >
            <Delete sx={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;