const express = require('express');
const router = express.Router();
const { Team, User, TeamMember, Goal, TeamInvitation } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');
const { sendTeamInvitation } = require('../utils/emailService');
const crypto = require('crypto');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// Get all teams (that the current user is a member of)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all teams the user is a member of
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          where: { id: userId },
          attributes: ['id', 'username', 'name', 'profilePhoto']
        }
      ]
    });
    
    res.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific team
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is a member of this team
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
    
    // Get team with members and goals
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'name', 'title', 'profilePhoto']
        },
        {
          model: Goal,
          as: 'goals'
        }
      ]
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new team
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    
    // Create the team
    const team = await Team.create({
      name,
      description
    });
    
    // Add the creator as a team leader
    await TeamMember.create({
      user_id: userId,
      team_id: team.id,
      role: 'leader'
    });
    
    res.status(201).json({ 
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update team details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const { name, description } = req.body;
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can update team details' });
    }
    
    // Update the team
    const team = await Team.findByPk(teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    team.name = name || team.name;
    team.description = description !== undefined ? description : team.description;
    
    await team.save();
    
    res.json({ 
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a team
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can delete teams' });
    }
    
    // Get the team
    const team = await Team.findByPk(teamId);
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Delete the team
    await team.destroy();
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a member to a team
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const { memberId, role = 'member' } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ message: 'Member ID is required' });
    }
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can add members' });
    }
    
    // Check if the member exists
    const member = await User.findByPk(memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already a member
    const existingMembership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: memberId }
    });
    
    if (existingMembership) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }
    
    // Add the member
    const newMembership = await TeamMember.create({
      user_id: memberId,
      team_id: teamId,
      role
    });
    
    res.status(201).json({ 
      message: 'Member added successfully',
      membership: newMembership
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a member from a team
router.delete('/:id/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const memberId = req.params.memberId;
    
    // Check if user is a team leader (unless removing self)
    if (userId !== parseInt(memberId)) {
      const membership = await TeamMember.findOne({
        where: { team_id: teamId, user_id: userId, role: 'leader' }
      });
      
      if (!membership) {
        return res.status(403).json({ message: 'Only team leaders can remove members' });
      }
    }
    
    // Find the membership to remove
    const membershipToRemove = await TeamMember.findOne({
      where: { team_id: teamId, user_id: memberId }
    });
    
    if (!membershipToRemove) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }
    
    // Remove the membership
    await membershipToRemove.destroy();
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team members
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is a member of this team
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
    
    // Get all members of the team
    const team = await Team.findByPk(teamId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'name', 'title', 'profilePhoto', 'email'],
          through: {
            attributes: ['role']
          }
        }
      ]
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    res.json({ members: team.Users });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign a goal to a team
router.post('/:id/goals', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const { goalId } = req.body;
    
    if (!goalId) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can assign goals to teams' });
    }
    
    // Check if the goal exists
    const goal = await Goal.findByPk(goalId);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Assign the goal to the team
    goal.team_id = teamId;
    await goal.save();
    
    res.json({ 
      message: 'Goal assigned to team successfully',
      goal
    });
  } catch (error) {
    console.error('Error assigning goal to team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team goals
router.get('/:id/goals', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is a member of this team
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
    
    // Get all goals of the team
    const goals = await Goal.findAll({
      where: { team_id: teamId },
      include: [
        {
          model: Task,
          as: 'tasks'
        },
        {
          model: KPI,
          as: 'kpis'
        },
        {
          model: User,
          attributes: ['id', 'username', 'name', 'profilePhoto']
        }
      ]
    });
    
    res.json({ goals });
  } catch (error) {
    console.error('Error fetching team goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEAM INVITATION ENDPOINTS

// Send team invitation by email
router.post('/:id/invitations', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can send invitations' });
    }
    
    // Get the team
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if invitation already exists and is pending
    const existingInvitation = await TeamInvitation.findOne({
      where: { 
        team_id: teamId, 
        email, 
        status: 'pending',
        expires_at: { 
          [Op.gt]: new Date() // Not expired
        }
      }
    });
    
    if (existingInvitation) {
      return res.status(400).json({ message: 'An invitation has already been sent to this email and is still pending' });
    }
    
    // Get the inviter's name for the email
    const inviter = await User.findByPk(userId);
    const inviterName = inviter.name || inviter.username;
    
    // Generate unique token for the invitation
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation record
    const invitation = await TeamInvitation.create({
      team_id: teamId,
      invited_by: userId,
      email,
      token,
      expires_at: expiresAt,
      status: 'pending'
    });
    
    // Generate invitation link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${baseUrl}/teams/invite/${token}`;
    
    // Send email invitation
    const emailResult = await sendTeamInvitation(
      email,
      inviterName,
      team.name,
      invitationLink
    );
    
    if (!emailResult.success) {
      // If email fails, delete the invitation and return error
      await invitation.destroy();
      return res.status(500).json({ message: 'Failed to send invitation email' });
    }
    
    res.status(201).json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Error sending team invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending invitations for a team
router.get('/:id/invitations', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can view invitations' });
    }
    
    // Get all pending invitations
    const invitations = await TeamInvitation.findAll({
      where: { 
        team_id: teamId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'inviter',
          attributes: ['id', 'username', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ invitations });
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel an invitation
router.delete('/:teamId/invitations/:invitationId', authMiddleware, async (req, res) => {
  try {
    const { teamId, invitationId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a team leader
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId, role: 'leader' }
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'Only team leaders can cancel invitations' });
    }
    
    // Find the invitation
    const invitation = await TeamInvitation.findOne({
      where: { 
        id: invitationId,
        team_id: teamId,
        status: 'pending'
      }
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }
    
    // Update invitation status to cancelled
    invitation.status = 'declined';
    await invitation.save();
    
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify and accept invitation (public route)
router.get('/invite/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the invitation by token
    const invitation = await TeamInvitation.findOne({
      where: { 
        token,
        status: 'pending'
      },
      include: [
        {
          model: Team,
          attributes: ['id', 'name', 'description']
        }
      ]
    });
    
    if (!invitation) {
      return res.status(404).json({ valid: false, message: 'Invitation not found or already processed' });
    }
    
    // Check if invitation is expired
    if (new Date() > invitation.expires_at) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ valid: false, message: 'Invitation has expired' });
    }
    
    // Return invitation details
    res.json({ 
      valid: true,
      invitation: {
        email: invitation.email,
        team: invitation.Team,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Accept invitation (create user if needed and add to team)
router.post('/invite/accept/:token', async (req, res) => {
  try {
    const { token: invitationToken } = req.params;
    const { username, password, name } = req.body;
    
    // Find the invitation by token
    const invitation = await TeamInvitation.findOne({
       where: { 
           token: invitationToken,  
           status: 'pending'
        },
      include: [
        {
          model: Team,
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }
    
    // Check if invitation is expired
    if (new Date() > invitation.expires_at) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }
    
    let user;
    
    // Check if user with this email already exists
    user = await User.findOne({ where: { email: invitation.email } });
    
    if (!user) {
      // If no user exists, create a new one
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required for new accounts' });
      }
      
      // Check if username is already taken
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      
      // Create new user
      user = await User.create({
        username,
        password, // Will be hashed via model hooks
        email: invitation.email,
        name: name || username
      });
    }
    
    // Check if user is already a member of the team
    const existingMembership = await TeamMember.findOne({
      where: { 
        team_id: invitation.team_id, 
        user_id: user.id 
      }
    });
    
    if (existingMembership) {
      // Update invitation status but don't add duplicate membership
      invitation.status = 'accepted';
      await invitation.save();
      
      return res.status(200).json({ 
        message: 'You are already a member of this team',
        team: invitation.Team,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        }
      });
    }
    
    // Add user to the team
    await TeamMember.create({
      team_id: invitation.team_id,
      user_id: user.id,
      role: 'member'
    });
    
    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();
    
    // Generate JWT token if user is new or for existing users to auto-login
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Invitation accepted successfully',
      team: invitation.Team,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});