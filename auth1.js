const express = require('express');
const router  = express.Router();
const { inscription, connexion, monProfil } = 
require('./authController');
const { authMiddleware } = require('./auth');

// POST /api/auth/inscription  → créer un compte
router.post('/inscription', inscription);

// POST /api/auth/connexion    → se connecter, reçoit un token JWT
router.post('/connexion', connexion);

// GET  /api/auth/profil       → voir son profil (token requis)
router.get('/profil', authMiddleware, monProfil);

module.exports = router;
