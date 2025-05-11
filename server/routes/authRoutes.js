const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');

console.log('=== AUTH ROUTES LOADED ===');

// Define separate storage configuration for profile photos
const profilePhotoDir = path.join(__dirname, '../uploads/profile-photos');
console.log('Profile photo directory absolute path:', profilePhotoDir);

// Ensure the directory exists
try {
  if (!fs.existsSync(profilePhotoDir)) {
    console.log('Creating profile photo directory');
    fs.mkdirSync(profilePhotoDir, { recursive: true });
  }
  console.log('Directory exists');
  
  // Test if directory is writable
  const testFile = path.join(profilePhotoDir, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  console.log('Directory is writable');
  fs.unlinkSync(testFile);
} catch (error) {
  console.error('Directory error:', error);
}

// Set up multer storage for profile photos
const profilePhotoStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log('Destination function called');
    console.log('Saving to directory:', profilePhotoDir);
    cb(null, profilePhotoDir);
  },
  filename: function(req, file, cb) {
    console.log('Filename function called');
    console.log('Original filename:', file.originalname);
    const uniqueFileName = `user_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    console.log('Generated filename:', uniqueFileName);
    cb(null, uniqueFileName);
  }
});

const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    console.log('File filter function called');
    console.log('File mimetype:', file.mimetype);
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      console.log('File rejected - not an image');
      return cb(new Error('Only image files are allowed!'), false);
    }
    console.log('File accepted');
    cb(null, true);
  }
}).single('profilePhoto');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

// Profile photo upload endpoint with error handling
router.post('/profile/photo', authMiddleware, (req, res) => {
  console.log("Profile photo upload request received");
  
  uploadProfilePhoto(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred
      console.error("Multer error:", err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred
      console.error("Unknown error:", err);
      return res.status(500).json({ message: `Unknown error: ${err.message}` });
    }
    
    // Everything went fine
    console.log("File uploaded successfully");
    
    // Continue with the rest of the code
    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    console.log("File details:", req.file);
    
    // Create the URL path to the photo
    const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    console.log("Photo URL:", photoUrl);
    
    // Update user in database
    User.findByPk(req.user.id)
      .then(user => {
        if (!user) {
          console.log("User not found");
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log("Updating user with photo URL");
        user.profilePhoto = photoUrl;
        return user.save();
      })
      .then(user => {
        console.log("User updated successfully");
        // Return user without password
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        res.json({
          message: 'Profile photo uploaded successfully',
          user: userResponse
        });
      })
      .catch(error => {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Database error' });
      });
  });
});

// Update profile information
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, title, phone, location } = req.body;
    
    // Get the user
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (title !== undefined) user.title = title;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    
    // Save the user
    await user.save();
    
    // Return user without password
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;