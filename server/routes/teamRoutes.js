const express = require('express');
const router = express.Router();
const { Team, User, TeamMember, Goal } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

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

module.exports = router;