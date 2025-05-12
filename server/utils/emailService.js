const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

/**
 * Send team invitation email
 */
const sendTeamInvitation = async (recipientEmail, inviterName, teamName, invitationLink, inviterEmail = null) => {
  const appName = process.env.APP_NAME || 'SMART Goals Tracker';
  
  const mailOptions = {
    from: `"${appName}" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `${inviterName} invited you to join ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4361ee; margin: 0;">${appName}</h1>
        </div>
        
        <h2 style="color: #333;">You've been invited to join a team!</h2>
        
        <p>Hello,</p>
        
        <p><strong>${inviterName}</strong>${inviterEmail ? ` (${inviterEmail})` : ''} has invited you to join their team <strong>${teamName}</strong> on ${appName}.</p>
        
        <p>By joining this team, you'll be able to:</p>
        <ul style="color: #555;">
          <li>Collaborate on goals and track progress together</li>
          <li>Share KPIs and financial metrics</li>
          <li>Contribute to the team's success</li>
          <li>Access team calendar and tasks</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #4361ee; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        ${inviterEmail ? `<p>If you have questions about this team, you can reach out to ${inviterName} at <a href="mailto:${inviterEmail}">${inviterEmail}</a>.</p>` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #666;">
            This invitation will expire in 7 days.
          </p>
          <p style="font-size: 12px; color: #666;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} ${appName} - Track, Measure, and Achieve Your Goals Together.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

/**
 * Send other notification emails (for future use)
 */
const sendGoalDeadlineReminder = async (userEmail, goalTitle, deadline) => {
  const appName = process.env.APP_NAME || 'SMART Goals Tracker';
  
  const mailOptions = {
    from: `"${appName}" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Goal Deadline Reminder: ${goalTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Goal Deadline Reminder</h2>
        <p>Your goal "<strong>${goalTitle}</strong>" has a deadline approaching on ${deadline}.</p>
        <p>Visit ${appName} to check your progress and make any necessary updates.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error };
  }
};

module.exports = {
  sendTeamInvitation,
  sendGoalDeadlineReminder
};