const express = require('express');
const router  = express.Router();
const { calculerItineraire, sauvegarderTrajet, historiqueTrajet } = 
require('./itineraireController')
const { authMiddleware } = require('./auth')

// GET  /api/itineraire?depart_lat=...&arrivee_lat=... → calculer (public)
router.get('/', calculerItineraire);

// POST /api/itineraire/sauvegarder → sauvegarder un trajet (connecté)
router.post('/sauvegarder', authMiddleware, sauvegarderTrajet);

// GET  /api/itineraire/historique  → mes trajets (connecté)
router.get('/historique', authMiddleware, historiqueTrajet);

module.exports = router;
