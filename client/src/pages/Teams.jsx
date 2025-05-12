import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import teamService from '../api/teamService';
import './Teams.css';

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ message: '', type: '' });

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

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedTeam) return;
  
    try {
      setLoading(true);
      
      // ✅ AICI FACE CEREREA CĂTRE API!
      await teamService.inviteToTeam(selectedTeam.id, { email: inviteEmail });
      
      setInviteStatus({
        message: 'Invitation sent successfully!',
        type: 'success'
      });
      
      // Clear email field but keep modal open for multiple invites
      setInviteEmail('');
      
      setTimeout(() => {
        setInviteStatus({ message: '', type: '' });
      }, 3000);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setInviteStatus({
        message: err.response?.data?.message || 'Failed to send invitation',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTeam = (teamId) => {
    navigate(`/teams/${teamId}`);
  };

  const openInviteModal = (team) => {
    setSelectedTeam(team);
    setInviteEmail('');
    setInviteStatus({ message: '', type: '' });
    setShowInviteModal(true);
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
                
                <div className="team-actions">
                  <button 
                    className="invite-btn"
                    onClick={() => openInviteModal(team)}
                  >
                    Invite Member
                  </button>
                  <button 
                    className="view-team-btn"
                    onClick={() => handleViewTeam(team.id)}
                  >
                    View Team
                  </button>
                </div>
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
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
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
                  className="form-control"
                  placeholder="Enter team name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="team-description">Description (Optional)</label>
                <textarea
                  id="team-description"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  rows="3"
                  className="form-control"
                  placeholder="Describe the team's purpose"
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
                  disabled={!newTeamName.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
        
        {/* Invite Member Modal */}
        <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Invite to {selectedTeam?.name}</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowInviteModal(false)}
              >
                &times;
              </button>
            </div>
            
            {inviteStatus.message && (
              <div className={`invite-status ${inviteStatus.type}`}>
                {inviteStatus.message}
              </div>
            )}
            
            <form onSubmit={handleSendInvitation}>
              <div className="form-group">
                <label htmlFor="invite-email">Email Address</label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="form-control"
                  placeholder="Enter recipient's email"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowInviteModal(false)}
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!inviteEmail.trim() || loading}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default Teams;