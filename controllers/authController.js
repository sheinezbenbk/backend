const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Clé secrète pour JWT 
const JWT_SECRET = 'f8a3b6c9d2e5f8a7b4c1d6e3f9a2b5c8';

// Connexion admin
exports.login = async (req, res) => {
  const { username, mot_de_passe } = req.body;
  
  try {
    // Vérifier si l'admin existe
    const admins = await db.query('SELECT * FROM administrateurs WHERE username = ?', [username]);
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    const admin = admins[0];
    
    // Si c'est la première connexion avec le mot de passe temporaire
    if (admin.mot_de_passe === 'mot_de_passe_temporaire') {
      // Vous pouvez forcer le changement de mot de passe ici
      return res.status(200).json({ 
        message: 'Veuillez changer votre mot de passe',
        requirePasswordChange: true,
        token: jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '1h' })
      });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = (mot_de_passe === admin.mot_de_passe); 
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    
    // Générer un token JWT
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

// Changer le mot de passe
exports.changePassword = async (req, res) => {
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;
  const adminId = req.admin.id; // Vient du middleware d'authentification
  
  try {
    // Récupérer l'admin
    const admins = await db.query('SELECT * FROM administrateurs WHERE id = ?', [adminId]);
    
    if (admins.length === 0) {
      return res.status(404).json({ message: 'Administrateur non trouvé' });
    }
    
    const admin = admins[0];
    
    // Vérifier l'ancien mot de passe (sauf s'il s'agit du mot de passe temporaire)
    if (admin.mot_de_passe !== 'mot_de_passe_temporaire') {
      const isPasswordValid = await bcrypt.compare(mot_de_passe_actuel, admin.mot_de_passe);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
    
    // Mettre à jour le mot de passe
    await db.query('UPDATE administrateurs SET mot_de_passe = ? WHERE id = ?', [hashedPassword, adminId]);
    
    res.status(200).json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Simple déconnexion - déplacé hors du bloc catch
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).json({ message: 'Token non fourni' });
    }
    
    // Décodez le token pour obtenir sa date d'expiration
    const decoded = jwt.decode(token);
    
    // Calculez la date d'expiration
    const expirationDate = new Date(decoded.exp * 1000);
    
    // Ajoutez le token à la liste noire
    await db.query('INSERT INTO tokens_blacklist (token, expiration) VALUES (?, ?)', [token, expirationDate]);
    
    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};