const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  const { username, mot_de_passe } = req.body;
  
  try {
    const admins = await db.query('SELECT * FROM administrateurs WHERE username = ?', [username]);
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    const admin = admins[0];
    
    if (admin.mot_de_passe === 'mot_de_passe_temporaire') {
      return res.status(200).json({ 
        message: 'Veuillez changer votre mot de passe',
        requirePasswordChange: true,
        token: jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '1h' })
      });
    }
    
    const isPasswordValid = (mot_de_passe === admin.mot_de_passe); 
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '8h' });
    
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      }
    });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.changePassword = async (req, res) => {
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;
  const adminId = req.admin.id; 
  
  try {
    const admins = await db.query('SELECT * FROM administrateurs WHERE id = ?', [adminId]);
    
    if (admins.length === 0) {
      return res.status(404).json({ message: 'Administrateur non trouvé' });
    }
    
    const admin = admins[0];
    
    if (admin.mot_de_passe !== 'mot_de_passe_temporaire') {
      const isPasswordValid = await bcrypt.compare(mot_de_passe_actuel, admin.mot_de_passe);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
    }
    
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
    
    await db.query('UPDATE administrateurs SET mot_de_passe = ? WHERE id = ?', [hashedPassword, adminId]);
    
    res.status(200).json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).json({ message: 'Token non fourni' });
    }
    
    const decoded = jwt.decode(token);
    
    const expirationDate = new Date(decoded.exp * 1000);
    
    await db.query('INSERT INTO tokens_blacklist (token, expiration) VALUES (?, ?)', [token, expirationDate]);
    
    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};