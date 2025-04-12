import api from './axios';

const taskService = {
  // Obținerea tuturor task-urilor
  getAllTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  // Obținerea task-urilor grupate după status
  getTasksByStatus: async () => {
    try {
      const response = await api.get('/tasks');
      const tasks = response.data.tasks || [];
      
      // Gruparea task-urilor după status
      const grouped = {
        'To Do': tasks.filter(task => task.status === 'To Do'),
        'In Progress': tasks.filter(task => task.status === 'In Progress'),
        'Completed': tasks.filter(task => task.status === 'Completed')
      };
      
      return grouped;
    } catch (error) {
      console.error('Error fetching and grouping tasks:', error);
      throw error;
    }
  },

  // Crearea unui task nou
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Actualizarea unui task existent
  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Ștergerea unui task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Actualizarea doar a status-ului unui task (pentru drag-and-drop)
  updateTaskStatus: async (id, status) => {
    const response = await api.put(`/tasks/${id}`, { status });
    return response.data;
  }
};

export default taskService;