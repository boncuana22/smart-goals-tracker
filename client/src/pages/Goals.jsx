import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import GoalCard from '../components/goals/GoalCard';
import GoalForm from '../components/goals/GoalForm';
import Modal from '../components/common/Modal';
import goalService from '../api/goalService';
import './Goals.css';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await goalService.getAllGoals();
      setGoals(response.goals || []);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Failed to load goals. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = () => {
    setCurrentGoal(null);
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal) => {
    setCurrentGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }
    
    try {
      await goalService.deleteGoal(id);
      setGoals(goals.filter(goal => goal.id !== id));
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const handleSubmitGoal = async (formData) => {
    try {
      if (currentGoal) {
        // Update existing goal
        const response = await goalService.updateGoal(currentGoal.id, formData);
        setGoals(goals.map(goal => 
          goal.id === currentGoal.id ? response.goal : goal
        ));
      } else {
        // Create new goal
        const response = await goalService.createGoal(formData);
        setGoals([...goals, response.goal]);
      }
      
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving goal:', err);
      alert('Failed to save goal. Please try again.');
    }
  };

  // Filtrare doar prin căutare
  const filteredGoals = goals.filter(goal => {
    if (!searchTerm) return true;
    return goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Layout>
      <div className="goals-container">
        <div className="goals-header">
          <h2>SMART Goals</h2>
          <button className="btn btn-primary" onClick={handleAddGoal}>
            Add New Goal
          </button>
        </div>
        
        <div className="goals-filter-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {isLoading ? (
          <div className="loading">Loading goals...</div>
        ) : filteredGoals.length === 0 ? (
          <div className="empty-goals">
            {searchTerm 
              ? 'No goals match your search criteria.' 
              : 'No goals have been created yet. Click "Add New Goal" to get started.'}
          </div>
        ) : (
          <div className="goals-grid">
            {filteredGoals.map(goal => (
              <GoalCard 
                key={goal.id}
                goal={goal}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}
        
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <GoalForm 
            goal={currentGoal}
            onSubmit={handleSubmitGoal}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default Goals;