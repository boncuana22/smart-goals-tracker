import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
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
  const [invitations, setInvitations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableGoals, setAvailableGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ message: '', type: '' });
  const [isLeader, setIsLeader] = useState(false);

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
      
      // Check if current user is a team leader
      const currentUserMembership = membersResponse.members?.find(member => 
        member.TeamMember && member.TeamMember.role === 'leader'
      );
      setIsLeader(!!currentUserMembership);
      
      // Get team goals
      const goalsResponse = await teamService.getTeamGoals(id);
      setGoals(goalsResponse.goals || []);
      
      // If user is a leader, get pending invitations
      if (currentUserMembership) {
        try {
          const invitationsResponse = await teamService.getTeamInvitations(id);
          setInvitations(invitationsResponse.invitations || []);
        } catch (err) {
          console.error('Error fetching invitations:', err);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Get all users
      const usersResponse = await userService.getAllUsers();
      const allUsers = usersResponse.users || [];
      
      // Filter out users already in the team
      const memberIds = members.map(member => member.id);
      const filteredUsers = allUsers.filter(user => !memberIds.includes(user.id));
      
      setAvailableUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load available users');
    }
  };

  const fetchAvailableGoals = async () => {
    try {
      // Get all goals
      const goalsResponse = await goalService.getAllGoals();
      const allGoals = goalsResponse.goals || [];
      
      // Filter out goals already assigned to a team
      const filteredGoals = allGoals.filter(goal => !goal.team_id);
      
      setAvailableGoals(filteredGoals);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load available goals');
    }
  };

  const handleAddMember = async () => {
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

  const handleAddGoal = async () => {
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

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setLoading(true);
      
      setInviteStatus({
        message: 'Invitation sent successfully!',
        type: 'success'
      });
      
      // Refresh invitations
      const invitationsResponse = await teamService.getTeamInvitations(id);
      setInvitations(invitationsResponse.invitations || []);
      
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

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      setLoading(true);
      await teamService.cancelInvitation(id, invitationId);
      
      // Refresh invitations
      const invitationsResponse = await teamService.getTeamInvitations(id);
      setInvitations(invitationsResponse.invitations || []);
      
      setError(null);
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation');
    } finally {
      setLoading(false);
    }
  };

  const openAddMemberModal = () => {
    fetchAvailableUsers();
    setSelectedUserId('');
    setShowAddMemberModal(true);
  };

  const openAddGoalModal = () => {
    fetchAvailableGoals();
    setSelectedGoalId('');
    setShowAddGoalModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="header-actions">
            {isLeader && (
              <button 
                className="invite-btn"
                onClick={() => setShowInviteModal(true)}
              >
                Invite Members
              </button>
            )}
            {isLeader && invitations.length > 0 && (
              <button 
                className="invitations-btn"
                onClick={() => setShowInvitationsModal(true)}
              >
                Pending Invitations ({invitations.length})
              </button>
            )}
            <button 
              className="back-button"
              onClick={() => navigate('/teams')}
            >
              Back to Teams
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="team-details-content">
          <div className="team-members-section">
            <div className="section-header">
              <h2>Team Members</h2>
              {isLeader && (
                <button 
                  className="add-button"
                  onClick={openAddMemberModal}
                >
                  Add Member
                </button>
              )}
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
                    {isLeader && member.TeamMember?.role !== 'leader' && (
                      <button 
                        className="remove-button"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    )}
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
              {isLeader && (
                <button 
                  className="add-button"
                  onClick={openAddGoalModal}
                >
                  Add Goal
                </button>
              )}
            </div>
            
            <div className="goals-list">
              {goals.length > 0 ? (
                goals.map(goal => (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <h3>{goal.title}</h3>
                      <span className={`goal-status status-${goal.status.toLowerCase().replace(' ', '-')}`}>
                        {goal.status}
                      </span>
                    </div>
                    
                    {goal.description && (
                      <p className="goal-description">{goal.description}</p>
                    )}
                    
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${goal.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="progress-value">{goal.progress || 0}%</span>
                    </div>
                    
                    <div className="goal-stats">
                      <div className="stat-item">
                        <span className="stat-label">Deadline:</span>
                        <span className="stat-value">{formatDate(goal.time_bound_date)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Tasks:</span>
                        <span className="stat-value">{goal.tasks?.length || 0}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">KPIs:</span>
                        <span className="stat-value">{goal.kpis?.length || 0}</span>
                      </div>
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
        <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)}>
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
            
            {availableUsers.length > 0 ? (
              <div>
                <div className="form-group">
                  <label htmlFor="user-select">Select User</label>
                  <select
                    id="user-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.username} ({user.email})
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
                    type="button" 
                    className="submit-btn"
                    onClick={handleAddMember}
                    disabled={!selectedUserId || loading}
                  >
                    Add Member
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-message">
                <p>No available users to add to this team.</p>
                <p>You can invite users by email instead.</p>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setShowInviteModal(true);
                  }}
                >
                  Invite by Email
                </button>
              </div>
            )}
          </div>
        </Modal>
        
        {/* Add Goal Modal */}
        <Modal isOpen={showAddGoalModal} onClose={() => setShowAddGoalModal(false)}>
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
              <div>
                <div className="form-group">
                  <label htmlFor="goal-select">Select Goal</label>
                  <select
                    id="goal-select"
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="form-control"
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
                    type="button" 
                    className="submit-btn"
                    onClick={handleAddGoal}
                    disabled={!selectedGoalId || loading}
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-message">
                <p>No available goals to add to this team. Create new goals first.</p>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowAddGoalModal(false);
                    navigate('/goals');
                  }}
                >
                  Create Goal
                </button>
              </div>
            )}
          </div>
        </Modal>
        
        {/* Invite by Email Modal */}
        <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Invite to {team.name}</h2>
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
                <div className="form-helper">
                  An invitation email will be sent with instructions to join the team.
                </div>
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
        
        {/* Pending Invitations Modal */}
        <Modal isOpen={showInvitationsModal} onClose={() => setShowInvitationsModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Pending Invitations</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowInvitationsModal(false)}
              >
                &times;
              </button>
            </div>
            
            {invitations.length > 0 ? (
              <div className="invitations-list">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="invitation-item">
                    <div className="invitation-info">
                      <div className="invitation-email">{invitation.email}</div>
                      <div className="invitation-date">
                        Sent: {formatDate(invitation.createdAt)}
                      </div>
                      <div className="invitation-date">
                        Expires: {formatDate(invitation.expires_at)}
                      </div>
                    </div>
                    <button 
                      className="cancel-invitation-btn"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="modal-message">
                <p>No pending invitations.</p>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowInvitationsModal(false);
                    setShowInviteModal(true);
                  }}
                >
                  Send Invitation
                </button>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="close-btn"
                onClick={() => setShowInvitationsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default TeamDetails;