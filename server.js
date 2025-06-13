// server.js - Version améliorée basée sur votre code existant
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // ✅ Ajouté pour lire le .env

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 3001; // ✅ Changé de 5000 à 3001 pour correspondre à votre frontend

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // ✅ Spécifié pour React
  credentials: true // ✅ Ajouté pour les cookies/auth
}));
app.use(express.json());

// ✅ Ajouté : Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Route pour vérifier si l'API fonctionne (votre route existante)
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'API opérationnelle' });
});

// ✅ Ajouté : Route health que votre React attend
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'API OMAC Torcy fonctionnelle!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Ajouté : Route de test de connexion BDD
app.get('/api/test-db', async (req, res) => {
  try {
    const db = require('./config/db');
    const result = await db.query('SELECT COUNT(*) as count FROM administrateurs');
    res.json({ 
      message: 'Connexion BDD réussie', 
      adminCount: result[0].count 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur connexion BDD', 
      error: error.message 
    });
  }
});

// ✅ Ajouté : Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} non trouvée` });
});

// ✅ Ajouté : Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Serveur OMAC démarré sur http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
  console.log(`💚 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Test BDD: http://localhost:${PORT}/api/test-db`); 
});

module.exports = app;// Test 2025-06-13 14:49:41
