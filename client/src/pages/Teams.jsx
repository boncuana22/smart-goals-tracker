import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import teamService from '../api/teamService';
import './Teams.css';

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamService.getUserTeams();
      setTeams(response.teams || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setLoading(true);
      const response = await teamService.createTeam({
        name: newTeamName,
        description: newTeamDescription
      });
      
      setTeams([...teams, response.team]);
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      setError(null);
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  if (loading && teams.length === 0) {
    return <Layout><div className="loading">Loading teams...</div></Layout>;
  }

  return (
    <Layout>
      <div className="teams-container">
        <div className="teams-header">
          <h1>My Teams</h1>
          <button 
            className="create-team-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create Team
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="teams-grid">
          {teams.length > 0 ? (
            teams.map(team => (
              <div key={team.id} className="team-card">
                <h2 className="team-name">{team.name}</h2>
                {team.description && (
                  <p className="team-description">{team.description}</p>
                )}
                
                <div className="team-stats">
                  <div className="stat">
                    <span className="stat-value">{team.Users?.length || 0}</span>
                    <span className="stat-label">Members</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{team.goals?.length || 0}</span>
                    <span className="stat-label">Goals</span>
                  </div>
                </div>
                
                <button 
                  className="view-team-btn"
                  onClick={() => handleViewTeam(team.id)}
                >
                  View Team
                </button>
              </div>
            ))
          ) : (
            <div className="no-teams-message">
              <p>You don't have any teams yet</p>
              <button 
                className="create-first-team-btn"
                onClick={() => setShowCreateModal(true)}
              >
                Create your first team
              </button>
            </div>
          )}
        </div>
        
        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Team</h2>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreateTeam}>
                <div className="form-group">
                  <label htmlFor="team-name">Team Name</label>
                  <input
                    id="team-name"
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="team-description">Description (Optional)</label>
                  <textarea
                    id="team-description"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={!newTeamName.trim()}
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Teams;