import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import teamService from '../api/teamService';
import './TeamInvite.css';

const TeamInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  useEffect(() => {
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await teamService.verifyInvitation(token);
      
      if (response.valid) {
        setInvitation(response.invitation);
        
        // If user is logged in and has same email as invitation, show accept button
        // If user is logged in with different email, show error
        // If no user is logged in, show registration form
        if (user) {
          if (user.email === response.invitation.email) {
            // User is already logged in with the correct email
            console.log('User already logged in with matching email');
          } else {
            setError(`This invitation was sent to ${response.invitation.email}, but you're logged in as ${user.email}`);
          }
        } else {
          setShowRegistrationForm(true);
        }
      } else {
        setError('Invalid or expired invitation');
      }
    } catch (err) {
      console.error('Error verifying invitation:', err);
      setError(err.response?.data?.message || 'Failed to verify invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAcceptInvitation = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🚀 Starting invitation acceptance...');
      console.log('🔍 Registration data:', {
        username: registrationData.username,
        name: registrationData.name,
        password: registrationData.password,
        confirmPassword: registrationData.confirmPassword
      });
      
      // If user is already logged in with matching email
      if (user && user.email === invitation.email) {
        console.log('✅ User already logged in, accepting directly...');
        await teamService.acceptInvitation(token, {});
        navigate('/teams');
        return;
      }
      
      // Check password match for new users
      const passwordsMatch = registrationData.password === registrationData.confirmPassword;
      console.log('🔍 Passwords match?', passwordsMatch);
      console.log('🔍 Password:', registrationData.password);
      console.log('🔍 Confirm Password:', registrationData.confirmPassword);
      
      if (!passwordsMatch) {
        console.log('❌ Frontend validation: Passwords do not match');
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Frontend validation passed, sending to server...');
      
      // Accept invitation with registration data for new users
      const dataToSend = {
        username: registrationData.username,
        password: registrationData.password,
        name: registrationData.name
      };
      
      console.log('📤 Sending data to server:', dataToSend);
      
      const response = await teamService.acceptInvitation(token, dataToSend);
      
      console.log('✅ Server response received:', response);
      
      // Auto login the user
      if (response.token) {
        console.log('🔑 Auto-logging in user...');
        await login({
          email: invitation.email,
          password: registrationData.password
        });
      }
      
      // Navigate to teams page
      console.log('📍 Navigating to teams page...');
      navigate('/teams');
    } catch (err) {
      console.error('❌ Error in handleAcceptInvitation:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Failed to accept invitation');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="team-invite-container">
        <div className="team-invite-card loading">
          <div className="spinner"></div>
          <p>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-invite-container">
        <div className="team-invite-card error">
          <h2>Invitation Error</h2>
          <p>{error}</p>
          <div className="invite-actions">
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/teams')}
            >
              Go to Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="team-invite-container">
        <div className="team-invite-card error">
          <h2>Invalid Invitation</h2>
          <p>This invitation link is invalid or has expired.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="team-invite-container">
      <div className="team-invite-card">
        <h2>Team Invitation</h2>
        
        <div className="invitation-details">
          <p>You've been invited to join:</p>
          <h3>{invitation.team.name}</h3>
          {invitation.team.description && (
            <p className="team-description">{invitation.team.description}</p>
          )}
          <p className="invitation-email">
            Invitation sent to: <strong>{invitation.email}</strong>
          </p>
        </div>
        
        {user && user.email === invitation.email ? (
          <div className="invitation-actions">
            <p className="info-message">
              You're logged in as <strong>{user.email}</strong>
            </p>
            <button 
              className="btn-primary" 
              onClick={handleAcceptInvitation}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Accept Invitation'}
            </button>
          </div>
        ) : showRegistrationForm ? (
          <div className="registration-section">
            <h3>Create Your Account</h3>
            <p className="info-message">
              Please create an account to join this team.
            </p>
            
            <form onSubmit={handleAcceptInvitation}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={registrationData.username}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Full Name (Optional)</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={registrationData.name}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={registrationData.password}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={registrationData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="invite-actions">
                <button
                  type="button" 
                  className="btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  I Already Have an Account
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Create Account & Join Team'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="invitation-actions">
            <p className="warning-message">
              Please log in with the account associated with <strong>{invitation.email}</strong> to accept this invitation.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamInvite;