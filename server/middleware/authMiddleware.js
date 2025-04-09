const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  try {
    // Verifică dacă există header-ul Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    // Extrage token-ul din header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // Verifică și decodează token-ul
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adaugă informațiile utilizatorului în obiectul request
    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};