const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Clé secrète pour JWT 
const JWT_SECRET = 'f8a3b6c9d2e5f8a7b4c1d6e3f9a2b5c8';

// Middleware pour vérifier l'authentification
exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    // Vérifier si le token est dans la liste noire
    const blacklistedTokens = await db.query('SELECT * FROM tokens_blacklist WHERE token = ?', [token]);
    
    if (blacklistedTokens.length > 0) {
      return res.status(401).json({ message: 'Token invalidé, veuillez vous reconnecter' });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier si l'admin existe toujours
    const admins = await db.query('SELECT id, username, email FROM administrateurs WHERE id = ?', [decoded.id]);
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Administrateur non trouvé' });
    }
    
    // Ajouter les informations d'admin à la requête
    req.admin = admins[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};