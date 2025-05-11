import React, { useState, useEffect } from 'react';
import './GoalForm.css';
import teamService from "../../api/teamService";

const GoalForm = ({ goal, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specific_details: '',
    measurable_metrics: '',
    achievable_factors: '',
    relevant_reasoning: '',
    time_bound_date: '',
    status: 'Not Started',
    progress: 0,
    team_id: null
  });
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Încarcă echipele utilizatorului
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await teamService.getUserTeams();
        setTeams(response.teams || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, []);

  useEffect(() => {
    if (goal) {
      // Format date for HTML date input
      let formattedDate = '';
      if (goal.time_bound_date) {
        const date = new Date(goal.time_bound_date);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        specific_details: goal.specific_details || '',
        measurable_metrics: goal.measurable_metrics || '',
        achievable_factors: goal.achievable_factors || '',
        relevant_reasoning: goal.relevant_reasoning || '',
        time_bound_date: formattedDate,
        status: goal.status || 'Not Started',
        progress: goal.progress || 0,
        team_id: goal.team_id || null
      });
    }
  }, [goal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'progress') {
      // Ensure progress is between 0 and 100
      const progress = Math.min(100, Math.max(0, parseInt(value) || 0));
      setFormData({ ...formData, progress });
    } else if (name === 'team_id') {
      // Convertește string-ul gol la null sau numărul la întreg
      const team_id = value === '' ? null : parseInt(value);
      setFormData({ ...formData, team_id });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="goal-form-container">
      <h2>{goal ? 'Edit SMART Goal' : 'Create New SMART Goal'}</h2>
      <p className="form-intro">
        SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.
        Fill in the details below to define your goal.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">Goal Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="e.g., Increase quarterly sales by 15%"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Brief Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              placeholder="Provide a brief overview of this goal"
              rows="2"
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
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="progress">Progress (%)</label>
              <input
                type="number"
                id="progress"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="form-control"
              />
            </div>
          </div>
          
          {/* Câmp pentru selectarea echipei */}
          <div className="form-group">
            <label htmlFor="team_id">Team (Optional)</label>
            <select
              id="team_id"
              name="team_id"
              value={formData.team_id || ''}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
            >
              <option value="">No Team</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            {loading && <div className="form-helper">Loading teams...</div>}
          </div>
        </div>
        
        <div className="form-section">
          <h3>SMART Criteria</h3>
          
          <div className="form-group">
            <label htmlFor="specific_details">
              Specific <span className="criteria-hint">- What exactly do you want to accomplish?</span>
            </label>
            <textarea
              id="specific_details"
              name="specific_details"
              value={formData.specific_details}
              onChange={handleChange}
              className="form-control"
              placeholder="Clearly define what you want to achieve"
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="measurable_metrics">
              Measurable <span className="criteria-hint">- How will you measure success?</span>
            </label>
            <textarea
              id="measurable_metrics"
              name="measurable_metrics"
              value={formData.measurable_metrics}
              onChange={handleChange}
              className="form-control"
              placeholder="Define specific metrics to track progress"
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="achievable_factors">
              Achievable <span className="criteria-hint">- Is this goal realistic?</span>
            </label>
            <textarea
              id="achievable_factors"
              name="achievable_factors"
              value={formData.achievable_factors}
              onChange={handleChange}
              className="form-control"
              placeholder="Describe why this goal is achievable"
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="relevant_reasoning">
              Relevant <span className="criteria-hint">- Why is this goal important?</span>
            </label>
            <textarea
              id="relevant_reasoning"
              name="relevant_reasoning"
              value={formData.relevant_reasoning}
              onChange={handleChange}
              className="form-control"
              placeholder="Explain how this goal aligns with broader objectives"
              rows="2"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="time_bound_date">
              Time-bound <span className="criteria-hint">- When should this goal be achieved?</span>
            </label>
            <input
              type="date"
              id="time_bound_date"
              name="time_bound_date"
              value={formData.time_bound_date}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {goal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm;