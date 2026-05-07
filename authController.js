const db = require('./db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
require('dotenv').config();

// ── INSCRIPTION ──
async function inscription(req, res) {
  const { nom, email, telephone, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'nom, email et mot_de_passe sont obligatoires.' });
  }

  try {
    // Vérifier si l'email existe déjà
    const [existing] = await db.execute(
      'SELECT id FROM utilisateurs WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 10);

    // Insérer l'utilisateur
    const [result] = await db.execute(
      'INSERT INTO utilisateurs (nom, email, telephone, mot_de_passe) VALUES (?, ?, ?, ?)',
      [nom, email, telephone || null, hash]
    );

    res.status(201).json({
      message: 'Compte créé avec succès ! Bienvenue sur Sunu Yoon 🎉',
      userId: result.insertId,
    });

  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── CONNEXION ──
async function connexion(req, res) {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'email et mot_de_passe sont obligatoires.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM utilisateurs WHERE email = ?', [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const user = rows[0];
    const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!valide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id:        user.id,
        nom:       user.nom,
        email:     user.email,
        telephone: user.telephone,
        points:    user.points,
        role:      user.role,
      },
    });

  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── MON PROFIL ──
async function monProfil(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT id, nom, email, telephone, points, role, created_at FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { inscription, connexion, monProfil };
