const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send team invitation email
 * @param {string} recipientEmail - Email of the invited person
 * @param {string} inviterName - Name of the person sending the invitation
 * @param {string} teamName - Name of the team
 * @param {string} invitationLink - Link to accept the invitation
 * @returns {Promise} - Result of sending the email
 */
const sendTeamInvitation = async (recipientEmail, inviterName, teamName, invitationLink) => {
  const mailOptions = {
    from: `"SMART Goals Tracker" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `Invitation to join team: ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4361ee;">You've been invited to join a team!</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join their team <strong>${teamName}</strong> on SMART Goals Tracker.</p>
        <p>By joining this team, you'll be able to collaborate on goals, track progress together, and contribute to the team's success.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" style="background-color: #4361ee; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
        </div>
        <p>If you didn't expect this invitation, you can simply ignore this email.</p>
        <p>The invitation link will expire in 7 days.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">SMART Goals Tracker - Track, Measure, and Achieve Your Goals Together.</p>
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

module.exports = {
  sendTeamInvitation
};