import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import authService from '../api/authService';
import taskService from '../api/taskService';
import goalService from '../api/goalService';
import './UserProfile.css';

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [metrics, setMetrics] = useState({
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    completionRate: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's tasks
        const tasksResponse = await taskService.getAllTasks();
        const userTasks = tasksResponse.tasks || [];
        setTasks(userTasks);
        
        // Fetch goals
        const goalsResponse = await goalService.getAllGoals();
        const userGoals = goalsResponse.goals || [];
        setGoals(userGoals);
        
        // Calculate metrics
        const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
        const inProgressTasks = userTasks.filter(task => task.status === 'In Progress').length;
        const todoTasks = userTasks.filter(task => task.status === 'To Do').length;
        const completionRate = userTasks.length > 0 
          ? Math.round((completedTasks / userTasks.length) * 100) 
          : 0;
        
        setMetrics({
          completedTasks,
          inProgressTasks,
          todoTasks,
          completionRate
        });
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should not exceed 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and GIF images are allowed');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      // Assuming you'll create this method in authService
      const response = await authService.uploadProfilePhoto(formData);
      
      // Update user context with new photo URL
      if (response.user && setUser) {
        setUser(response.user);
      }
      
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setError('Failed to upload profile photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Layout><div className="loading">Loading profile...</div></Layout>;
  }

  return (
    <Layout>
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-photo-container">
              {user.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user.username} 
                  className="profile-photo" 
                />
              ) : (
                <div className="profile-photo-placeholder">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              
              <label className="photo-upload-button" htmlFor="photo-upload">
                Change Photo
                <input 
                  type="file" 
                  id="photo-upload" 
                  className="hidden-input" 
                  onChange={handleProfilePhotoUpload}
                  disabled={uploading}
                />
              </label>
              
              {uploading && <div className="uploading-indicator">Uploading...</div>}
            </div>
            
            <div className="profile-details">
              <h2>{user.name || user.username}</h2>
              <p className="profile-title">{user.title || 'Team Member'}</p>
              
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{user.phone}</span>
                  </div>
                )}
                
                {user.location && (
                  <div className="info-item">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{user.location}</span>
                  </div>
                )}
              </div>
              
              <button className="edit-profile-button">Edit Profile</button>
            </div>
          </div>
          
          <div className="profile-main">
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{metrics.completedTasks}</div>
                <div className="metric-label">Completed Tasks</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{metrics.inProgressTasks}</div>
                <div className="metric-label">In Progress</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{metrics.todoTasks}</div>
                <div className="metric-label">To Do</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{metrics.completionRate}%</div>
                <div className="metric-label">Completion Rate</div>
              </div>
            </div>
            
            <div className="section">
              <div className="section-header">
                <h3>My Tasks</h3>
                <a href="/tasks" className="view-all-link">View All</a>
              </div>
              
              <div className="tasks-list">
                {tasks.length > 0 ? (
                  tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="task-item">
                      <div className={`task-status status-${task.status.toLowerCase().replace(' ', '-')}`}></div>
                      <div className="task-details">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          {task.due_date && (
                            <span className="due-date">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`priority priority-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No tasks assigned to you</div>
                )}
              </div>
            </div>
            
            <div className="section">
              <div className="section-header">
                <h3>My Goals</h3>
                <a href="/goals" className="view-all-link">View All</a>
              </div>
              
              <div className="goals-list">
                {goals.length > 0 ? (
                  goals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="goal-item">
                      <div className="goal-info">
                        <div className="goal-title">{goal.title}</div>
                        <div className="goal-meta">
                          <span className={`goal-status status-${goal.status.toLowerCase().replace(' ', '-')}`}>
                            {goal.status}
                          </span>
                          {goal.time_bound_date && (
                            <span className="deadline">
                              Deadline: {new Date(goal.time_bound_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="goal-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${goal.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="progress-value">{goal.progress || 0}%</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No goals available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;