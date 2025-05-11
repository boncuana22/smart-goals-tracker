import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import teamService from '../api/teamService';
import userService from '../api/userService';
import goalService from '../api/goalService';
import './TeamDetails.css';

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [availableGoals, setAvailableGoals] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      
      // Get team details
      const teamResponse = await teamService.getTeamById(id);
      setTeam(teamResponse.team);
      
      // Get team members
      const membersResponse = await teamService.getTeamMembers(id);
      setMembers(membersResponse.members || []);
      
      // Get team goals
      const goalsResponse = await teamService.getTeamGoals(id);
      setGoals(goalsResponse.goals || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberClick = async () => {
    try {
      // Fetch users not in the team
      const usersResponse = await userService.getAllUsers();
      const allUsers = usersResponse.users || [];
      const memberIds = members.map(member => member.id);
      const filteredUsers = allUsers.filter(user => !memberIds.includes(user.id));
      
      setUsers(filteredUsers);
      setShowAddMemberModal(true);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleAddGoalClick = async () => {
    try {
      // Fetch goals not assigned to this team
      const goalsResponse = await goalService.getAllGoals();
      const allGoals = goalsResponse.goals || [];
      const teamGoalIds = goals.map(goal => goal.id);
      const filteredGoals = allGoals.filter(goal => !teamGoalIds.includes(goal.id) && !goal.team_id);
      
      setAvailableGoals(filteredGoals);
      setShowAddGoalModal(true);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    try {
      setLoading(true);
      await teamService.addTeamMember(id, selectedUserId);
      
      // Refresh team members
      const membersResponse = await teamService.getTeamMembers(id);
      setMembers(membersResponse.members || []);
      
      setShowAddMemberModal(false);
      setSelectedUserId('');
      setError(null);
    } catch (err) {
      console.error('Error adding team member:', err);
      setError('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!selectedGoalId) return;
    
    try {
      setLoading(true);
      await teamService.assignGoalToTeam(id, selectedGoalId);
      
      // Refresh team goals
      const goalsResponse = await teamService.getTeamGoals(id);
      setGoals(goalsResponse.goals || []);
      
      setShowAddGoalModal(false);
      setSelectedGoalId('');
      setError(null);
    } catch (err) {
      console.error('Error assigning goal to team:', err);
      setError('Failed to assign goal');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      setLoading(true);
      await teamService.removeTeamMember(id, memberId);
      
      // Refresh team members
      const membersResponse = await teamService.getTeamMembers(id);
      setMembers(membersResponse.members || []);
      
      setError(null);
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !team) {
    return <Layout><div className="loading">Loading team details...</div></Layout>;
  }

  if (!team) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Team not found</h2>
          <button onClick={() => navigate('/teams')}>Back to Teams</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="team-details-container">
        <div className="team-details-header">
          <div>
            <h1>{team.name}</h1>
            {team.description && <p className="team-description">{team.description}</p>}
          </div>
          <button 
            className="back-button"
            onClick={() => navigate('/teams')}
          >
            Back to Teams
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="team-details-content">
          <div className="team-members-section">
            <div className="section-header">
              <h2>Team Members</h2>
              <button 
                className="add-button"
                onClick={handleAddMemberClick}
              >
                Add Member
              </button>
            </div>
            
            <div className="members-list">
              {members.length > 0 ? (
                members.map(member => (
                  <div key={member.id} className="member-card">
                    <div className="member-info">
                      {member.profilePhoto ? (
                        <img 
                          src={member.profilePhoto} 
                          alt={member.name || member.username} 
                          className="member-avatar" 
                        />
                      ) : (
                        <div className="member-avatar-placeholder">
                          {(member.name || member.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3>{member.name || member.username}</h3>
                        <p className="member-role">{member.TeamMember?.role || 'Member'}</p>
                      </div>
                    </div>
                    <button 
                      className="remove-button"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">No members in this team yet</div>
              )}
            </div>
          </div>
          
          <div className="team-goals-section">
            <div className="section-header">
              <h2>Team Goals</h2>
              <button 
                className="add-button"
                onClick={handleAddGoalClick}
              >
                Add Goal
              </button>
            </div>
            
            <div className="goals-list">
              {goals.length > 0 ? (
                goals.map(goal => (
                  <div key={goal.id} className="goal-card">
                    <h3>{goal.title}</h3>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${goal.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="progress-value">{goal.progress || 0}%</span>
                    </div>
                    <div className="goal-status">
                      Status: <span className={`status-${goal.status.toLowerCase().replace(' ', '-')}`}>{goal.status}</span>
                    </div>
                    <button 
                      className="view-button"
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">No goals assigned to this team yet</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add Team Member</h2>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  &times;
                </button>
              </div>
              
              {users.length > 0 ? (
                <form onSubmit={handleAddMember}>
                  <div className="form-group">
                    <label htmlFor="user-select">Select User</label>
                    <select
                      id="user-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">Select a user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowAddMemberModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={!selectedUserId}
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              ) : (
                <div className="modal-message">
                  <p>No available users to add to this team.</p>
                  <button 
                    className="close-btn"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Add Goal Modal */}
        {showAddGoalModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add Goal to Team</h2>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowAddGoalModal(false)}
                >
                  &times;
                </button>
              </div>
              
              {availableGoals.length > 0 ? (
                <form onSubmit={handleAddGoal}>
                  <div className="form-group">
                    <label htmlFor="goal-select">Select Goal</label>
                    <select
                      id="goal-select"
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      required
                    >
                      <option value="">Select a goal</option>
                      {availableGoals.map(goal => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowAddGoalModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={!selectedGoalId}
                    >
                      Add Goal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="modal-message">
                  <p>No available goals to add to this team. Create new goals first.</p>
                  <button 
                    className="close-btn"
                    onClick={() => setShowAddGoalModal(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamDetails;