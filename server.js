const express = require("express")
const cors = require("cors")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const eventRoutes = require("./routes/eventRoutes")

const app = express()
const PORT = process.env.PORT || 3001

// ✅ MODIFICATION : Configuration CORS améliorée
app.use(
  cors({  
    origin: [
      "http://localhost:3000", // Votre React en local
      "http://127.0.0.1:3000", // Alternative localhost
      "https://votre-frontend.vercel.app", // Votre frontend en production (à remplacer)
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())

// ✅ AJOUT : Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Route racine
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API OMAC Torcy opérationnelle !",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth/*",
      events: "/api/events/*",
    },
  })
})

// ✅ AJOUT : Route health que votre React attend
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API OMAC Torcy fonctionnelle!",
    timestamp: new Date().toISOString(),
  })
})

// Vos routes existantes
app.use("/api/auth", authRoutes)
app.use("/api/events", eventRoutes)

// Route pour vérifier si l'API fonctionne
app.get("/api/status", (req, res) => {
  res.json({ status: "online", message: "API opérationnelle" })
})

// ✅ AJOUT : Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} non trouvée` })
})

// ✅ AJOUT : Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error("Erreur serveur:", error)
  res.status(500).json({
    message: "Erreur interne du serveur",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur OMAC démarré sur http://localhost:${PORT}`)
  console.log(`📊 Environnement: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`)
  console.log(`💚 API Health: http://localhost:${PORT}/api/health`)
})

module.exports = app
