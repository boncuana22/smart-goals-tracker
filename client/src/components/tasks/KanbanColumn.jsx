import React from 'react';
import TaskCard from './TaskCard';
import './KanbanColumn.css';

const KanbanColumn = ({ 
  title, 
  tasks, 
  onDrop, 
  onEditTask, 
  onDeleteTask 
}) => {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDrop) {
      onDrop(taskId, title);
    }
  };

  return (
    <div 
      className="kanban-column"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h2>{title}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="column-content">
        {tasks.length === 0 ? (
          <div className="empty-column">
            <p>No tasks yet</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;