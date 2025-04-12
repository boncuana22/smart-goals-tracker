import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import KanbanColumn from '../components/tasks/KanbanColumn';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/common/Modal';
import taskService from '../api/taskService';
import goalService from '../api/goalService';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState({
    'To Do': [],
    'In Progress': [],
    'Completed': []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Încărcarea task-urilor la montarea componentei
  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const response = await goalService.getAllGoals();
        setGoals(response.goals || []);
      } catch (err) {
        console.error('Error loading goals:', err);
      }
    };
    
    loadGoals();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const groupedTasks = await taskService.getTasksByStatus();
      setTasks(groupedTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funcție pentru gestionarea drag & drop între coloane
  const handleDrop = async (taskId, newStatus) => {
    try {
      // Găsește task-ul în array-ul corespunzător
      let task = null;
      let oldStatus = null;
      
      for (const status in tasks) {
        const foundTask = tasks[status].find(t => t.id === parseInt(taskId));
        if (foundTask) {
          task = foundTask;
          oldStatus = status;
          break;
        }
      }
      
      if (!task || oldStatus === newStatus) return;
      
      // Optimistic update: Update UI immediately before API call
      setTasks(prevTasks => {
        const updatedTasks = { ...prevTasks };
        updatedTasks[oldStatus] = updatedTasks[oldStatus].filter(t => t.id !== parseInt(taskId));
        updatedTasks[newStatus] = [...updatedTasks[newStatus], { ...task, status: newStatus }];
        return updatedTasks;
      });
      
      // Update task status in the backend
      await taskService.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert changes in case of error
      loadTasks();
    }
  };

  const handleAddTask = () => {
    setCurrentTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await taskService.deleteTask(taskId);
      
      // Update local state
      setTasks(prevTasks => {
        const updatedTasks = { ...prevTasks };
        for (const status in updatedTasks) {
          updatedTasks[status] = updatedTasks[status].filter(task => task.id !== taskId);
        }
        return updatedTasks;
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleSubmitTask = async (formData) => {
    try {
      if (currentTask) {
        // Update existing task
        const updatedTask = await taskService.updateTask(currentTask.id, formData);
        
        // Update local state
        setTasks(prevTasks => {
          const updatedTasks = { ...prevTasks };
          for (const status in updatedTasks) {
            updatedTasks[status] = updatedTasks[status].map(task => 
              task.id === currentTask.id ? { ...updatedTask.task } : task
            );
          }
          
          // Move task if status changed
          if (updatedTask.task.status !== currentTask.status) {
            updatedTasks[currentTask.status] = updatedTasks[currentTask.status].filter(
              task => task.id !== currentTask.id
            );
            updatedTasks[updatedTask.task.status].push(updatedTask.task);
          }
          
          return updatedTasks;
        });
      } else {
        // Create new task
        const newTask = await taskService.createTask(formData);
        
        // Update local state
        setTasks(prevTasks => {
          const updatedTasks = { ...prevTasks };
          updatedTasks[newTask.task.status] = [...updatedTasks[newTask.task.status], newTask.task];
          return updatedTasks;
        });
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="tasks-container">
        <div className="tasks-header">
          <h2>Task Management</h2>
          <button className="btn btn-primary" onClick={handleAddTask}>
            Add New Task
          </button>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {isLoading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <div className="kanban-board">
            <KanbanColumn 
              title="To Do" 
              tasks={tasks['To Do']} 
              onDrop={handleDrop}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
            <KanbanColumn 
              title="In Progress" 
              tasks={tasks['In Progress']} 
              onDrop={handleDrop}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
            <KanbanColumn 
              title="Completed" 
              tasks={tasks['Completed']} 
              onDrop={handleDrop}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <TaskForm 
            task={currentTask}
            onSubmit={handleSubmitTask}
            onCancel={() => setIsModalOpen(false)}
            goals={goals}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default Tasks;