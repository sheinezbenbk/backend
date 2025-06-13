const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    const blacklistedTokens = await db.query('SELECT * FROM tokens_blacklist WHERE token = ?', [token]);
    
    if (blacklistedTokens.length > 0) {
      return res.status(401).json({ message: 'Token invalidé, veuillez vous reconnecter' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const admins = await db.query('SELECT id, username, email FROM administrateurs WHERE id = ?', [decoded.id]);
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Administrateur non trouvé' });
    }
    
    req.admin = admins[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};