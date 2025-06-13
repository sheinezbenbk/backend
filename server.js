// server.js - Version améliorée basée sur votre code existant
const express = require("express")
const cors = require("cors")
require("dotenv").config() // ✅ Ajouté pour lire le .env

const authRoutes = require("./routes/authRoutes")
const eventRoutes = require("./routes/eventRoutes")

const app = express()
const PORT = process.env.PORT || 3001 // ✅ Changé de 5000 à 3001 pour correspondre à votre frontend

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // ✅ Spécifié pour React
    credentials: true, // ✅ Ajouté pour les cookies/auth
  }),
)
app.use(express.json())

// ✅ Ajouté : Middleware de logging pour debug
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
      test: "/test",
      auth: "/api/auth/*",
      events: "/api/events/*",
    },
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/events", eventRoutes)

// Route pour vérifier si l'API fonctionne (votre route existante)
app.get("/api/status", (req, res) => {
  res.json({ status: "online", message: "API opérationnelle" })
})

// ✅ Ajouté : Route health que votre React attend
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API OMAC Torcy fonctionnelle!",
    timestamp: new Date().toISOString(),
  })
})

// ✅ NOUVELLES ROUTES DE TEST - Ajoutées directement ici
app.get("/api/test-env", (req, res) => {
  const vars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]
  const status = {}

  vars.forEach((v) => {
    status[v] = !!process.env[v]
  })

  res.json({ variables: status })
})

app.get("/api/test-db", async (req, res) => {
  try {
    const db = require("./config/db")
    const result = await db.query("SELECT 1 as test, NOW() as server_time")

    res.json({
      success: true,
      message: "✅ Connexion SiteGround réussie!",
      server_time: result[0].server_time,
      database: process.env.DB_NAME,
    })
  } catch (error) {
    let errorMessage = "❌ Erreur de connexion"

    if (error.code === "ENOTFOUND") {
      errorMessage = "❌ Hostname introuvable - Vérifiez DB_HOST"
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      errorMessage = "❌ Accès refusé - Vérifiez DB_USER/DB_PASSWORD"
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error_code: error.code,
    })
  }
})

app.get("/api/test-tables", async (req, res) => {
  try {
    const db = require("./config/db")
    const tables = ["administrateurs", "evenements", "tokens_blacklist"]
    const tableStatus = {}

    for (const tableName of tables) {
      try {
        const tableExists = await db.query(`SHOW TABLES LIKE '${tableName}'`)
        if (tableExists.length > 0) {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`)
          tableStatus[tableName] = {
            exists: true,
            status: "✅ OK",
            count: countResult[0].count,
          }
        } else {
          tableStatus[tableName] = { exists: false, status: "❌ MANQUANTE" }
        }
      } catch (error) {
        tableStatus[tableName] = { exists: false, status: "❌ ERREUR", error: error.message }
      }
    }

    const allTablesExist = Object.values(tableStatus).every((table) => table.exists)

    res.json({
      success: allTablesExist,
      message: allTablesExist ? "✅ Toutes les tables OK" : "❌ Tables manquantes",
      tables: tableStatus,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: `❌ Erreur tables: ${error.message}` })
  }
})

app.get("/api/test-data", async (req, res) => {
  try {
    const db = require("./config/db")
    const tests = {}

    // Test admins
    try {
      const admins = await db.query("SELECT id, username FROM administrateurs LIMIT 3")
      tests.admins = { success: true, count: admins.length, message: `✅ ${admins.length} admin(s)` }
    } catch (error) {
      tests.admins = { success: false, message: "❌ Erreur admins", error: error.message }
    }

    // Test événements
    try {
      const events = await db.query("SELECT id, titre FROM evenements LIMIT 3")
      tests.events = { success: true, count: events.length, message: `✅ ${events.length} événement(s)` }
    } catch (error) {
      tests.events = { success: false, message: "❌ Erreur événements", error: error.message }
    }

    const allTestsPassed = Object.values(tests).every((test) => test.success)

    res.json({
      success: allTestsPassed,
      message: allTestsPassed ? "✅ Données accessibles" : "❌ Problèmes données",
      tests,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: `❌ Erreur données: ${error.message}` })
  }
})

// ✅ PAGE DE TEST SIMPLE - Une seule route
app.get("/test", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test OMAC - SiteGround</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-4">
    <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-lg shadow p-6">
            <h1 class="text-2xl font-bold mb-4 text-blue-600">🔍 Test Connexion OMAC ↔ SiteGround</h1>
            
            <button onclick="runAllTests()" id="testBtn" class="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700">
                🚀 Lancer les tests
            </button>
            
            <div id="results" class="space-y-2"></div>
        </div>
    </div>

    <script>
        const tests = [
            { name: '🏥 API Health', url: '/api/health' },
            { name: '⚙️ Variables ENV', url: '/api/test-env' },
            { name: '🔌 Connexion DB', url: '/api/test-db' },
            { name: '📋 Tables', url: '/api/test-tables' },
            { name: '📊 Données', url: '/api/test-data' }
        ];

        async function runTest(test) {
            try {
                const response = await fetch(test.url);
                const data = await response.json();
                return {
                    name: test.name,
                    success: response.ok && data.success !== false,
                    message: data.message || 'Test terminé',
                    details: data
                };
            } catch (error) {
                return {
                    name: test.name,
                    success: false,
                    message: 'Erreur de connexion: ' + error.message
                };
            }
        }

        async function runAllTests() {
            const btn = document.getElementById('testBtn');
            const results = document.getElementById('results');
            
            btn.disabled = true;
            btn.textContent = '⏳ Tests en cours...';
            results.innerHTML = '';

            for (const test of tests) {
                const result = await runTest(test);
                const color = result.success ? 'green' : 'red';
                const icon = result.success ? '✅' : '❌';
                
                results.innerHTML += \`
                    <div class="p-3 border rounded \${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                        <div class="font-medium">\${icon} \${result.name}</div>
                        <div class="text-sm text-gray-600">\${result.message}</div>
                        \${result.details ? '<details class="text-xs mt-1"><summary>Détails</summary><pre class="mt-1 p-2 bg-gray-100 rounded overflow-auto">' + JSON.stringify(result.details, null, 2) + '</pre></details>' : ''}
                    </div>
                \`;
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            btn.disabled = false;
            btn.textContent = '🔄 Relancer les tests';
        }
    </script>
</body>
</html>
  `)
})

// ✅ Ajouté : Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} non trouvée` })
})

// ✅ Ajouté : Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error("Erreur serveur:", error)
  res.status(500).json({
    message: "Erreur interne du serveur",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  })
})

app.get("/", (req, res) => {
  res.json({ message: "API OMAC fonctionne!" })
})

app.listen(PORT, () => {
  console.log(`🚀 Serveur OMAC démarré sur http://localhost:${PORT}`)
  console.log(`📊 Environnement: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`)
  console.log(`💚 API Health: http://localhost:${PORT}/api/health`)
  console.log(`🗄️  Test BDD: http://localhost:${PORT}/api/test-db`)
  console.log(`🧪 Page de test: http://localhost:${PORT}/test`)
  console.log(`Serveur démarré sur port ${PORT}`)
})

module.exports = app
