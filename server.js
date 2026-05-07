const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ── MIDDLEWARES ──
app.use(cors());                        // Autorise les requêtes du frontend
app.use(express.json());                // Lire le JSON dans les requêtes
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ──
app.use('/api/auth',       require('./auth1'));
app.use('/api/obstacles',  require('./obstacles'));
app.use('/api/itineraire', require('./itineraire'));

// ── ROUTE D'ACCUEIL ──
app.get('/', (req, res) => {
  res.json({
    app:     'Sunu Yoon API 🗺️',
    version: '1.0.0',
    statut:  'En ligne ✅',
    routes:  [
      'POST /api/auth/inscription',
      'POST /api/auth/connexion',
      'GET  /api/auth/profil',
      'GET  /api/obstacles',
      'POST /api/obstacles',
      'POST /api/obstacles/:id/vote',
      'PUT  /api/obstacles/:id/resoudre',
      'GET  /api/itineraire?depart_lat=&depart_lng=&arrivee_lat=&arrivee_lng=',
      'POST /api/itineraire/sauvegarder',
      'GET  /api/itineraire/historique',
    ],
  });
});

// ── ROUTE 404 ──
app.use((req, res) => {
  res.status(404).json({ message: `Route "${req.method} ${req.url}" introuvable.` });
});

// ── DÉMARRAGE ──
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════╗');
  console.log('║   🗺️  SUNU YOON — Backend API       ║');
  console.log(`║   ✅  Serveur lancé sur port ${PORT}   ║`);
  console.log('║   📍  http://localhost:' + PORT + '         ║');
  console.log('╚════════════════════════════════════╝');
  console.log('');
});
