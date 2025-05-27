const db = require('../config/db');

// Obtenir tous les événements
exports.getEvents = async (req, res) => {
  try {
    let events;
    
    // Si c'est l'admin (authentifié), on renvoie tous les détails
    if (req.admin) {
      events = await db.query('SELECT * FROM evenements ORDER BY date_debut');
    } else {
      // Pour les visiteurs, on renvoie uniquement les informations nécessaires pour l'affichage
      events = await db.query('SELECT id, titre, description, date_debut, date_fin, couleur, toute_la_journee FROM evenements ORDER BY date_debut');
    }
    
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un événement (admin uniquement)
exports.createEvent = async (req, res) => {
  const { titre, description, date_debut, date_fin, couleur, toute_la_journee } = req.body;
  const admin_id = req.admin.id;
  
  try {
    const result = await db.query(
      'INSERT INTO evenements (titre, description, date_debut, date_fin, couleur, toute_la_journee, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titre, description, date_debut, date_fin, couleur, toute_la_journee, admin_id]
    );
    
    res.status(201).json({ 
      message: 'Événement créé avec succès',
      eventId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un événement (admin uniquement)
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { titre, description, date_debut, date_fin, couleur, toute_la_journee } = req.body;
  
  try {
    await db.query(
      'UPDATE evenements SET titre = ?, description = ?, date_debut = ?, date_fin = ?, couleur = ?, toute_la_journee = ? WHERE id = ?',
      [titre, description, date_debut, date_fin, couleur, toute_la_journee, id]
    );
    
    res.status(200).json({ message: 'Événement mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un événement (admin uniquement)
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query('DELETE FROM evenements WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};