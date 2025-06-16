const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("../config/db")

const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-jwt"

exports.login = async (req, res) => {
  try {
    const { username, mot_de_passe } = req.body

    console.log("🔄 Tentative de connexion:", username)

    if (!username || !mot_de_passe) {
      return res.status(400).json({
        message: "Nom d'utilisateur et mot de passe requis",
      })
    }

    // Rechercher l'administrateur
    const admins = await db.query("SELECT * FROM administrateurs WHERE username = ?", [username])

    if (admins.length === 0) {
      console.log("❌ Utilisateur non trouvé:", username)
      return res.status(401).json({
        message: "Identifiants invalides",
      })
    }

    const admin = admins[0]

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(mot_de_passe, admin.mot_de_passe)

    if (!isValidPassword) {
      console.log("❌ Mot de passe incorrect pour:", username)
      return res.status(401).json({
        message: "Identifiants invalides",
      })
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    console.log("✅ Connexion réussie pour:", username)

    res.json({
      message: "Connexion réussie",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    })
  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error)
    res.status(500).json({
      message: "Erreur serveur lors de la connexion",
    })
  }
}

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (token) {
      // Ajouter le token à la blacklist
      await db.query("INSERT INTO tokens_blacklist (token, created_at) VALUES (?, NOW())", [token])
    }

    res.json({ message: "Déconnexion réussie" })
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error)
    res.status(500).json({ message: "Erreur lors de la déconnexion" })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const adminId = req.admin.id

    // Vérifier l'ancien mot de passe
    const admins = await db.query("SELECT mot_de_passe FROM administrateurs WHERE id = ?", [adminId])

    const isValidPassword = await bcrypt.compare(currentPassword, admins[0].mot_de_passe)

    if (!isValidPassword) {
      return res.status(400).json({
        message: "Mot de passe actuel incorrect",
      })
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await db.query("UPDATE administrateurs SET mot_de_passe = ? WHERE id = ?", [hashedPassword, adminId])

    res.json({ message: "Mot de passe modifié avec succès" })
  } catch (error) {
    console.error("Erreur changement mot de passe:", error)
    res.status(500).json({ message: "Erreur lors du changement de mot de passe" })
  }
}
