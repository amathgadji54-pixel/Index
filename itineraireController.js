const db = require('./db');

// ── CALCULER UN ITINÉRAIRE ──
// Utilise l'API OSRM publique (gratuite, basée sur OpenStreetMap)
// En production : héberger son propre serveur OSRM avec les données Dakar

async function calculerItineraire(req, res) {
  const { depart_lat, depart_lng, arrivee_lat, arrivee_lng } = req.query;

  if (!depart_lat || !depart_lng || !arrivee_lat || !arrivee_lng) {
    return res.status(400).json({
      message: 'Paramètres requis : depart_lat, depart_lng, arrivee_lat, arrivee_lng'
    });
  }

  try {
    // Appel à l'API OSRM publique
    const url = `https://router.project-osrm.org/route/v1/driving/` +
      `${depart_lng},${depart_lat};${arrivee_lng},${arrivee_lat}` +
      `?overview=full&geometries=geojson&alternatives=true&steps=true`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      return res.status(404).json({ message: 'Aucun itinéraire trouvé.' });
    }

    // Récupérer les obstacles actifs sur les itinéraires
    const [obstacles] = await db.execute(
      `SELECT id, type, latitude, longitude, lieu, description
       FROM obstacles WHERE statut = 'actif' AND (expire_at IS NULL OR expire_at > NOW())`
    );

    // Formater les routes retournées
    const routes = data.routes.map((route, index) => {
      // Vérifier si des obstacles se trouvent près de cette route
      const obstaclesSurRoute = obstacles.filter(obs => {
        return estSurRoute(obs.latitude, obs.longitude, route.geometry.coordinates);
      });

      return {
        index,
        distance_km:  (route.distance / 1000).toFixed(2),
        duree_min:    Math.ceil(route.duration / 60),
        geometrie:    route.geometry,
        obstacles_detectes: obstaclesSurRoute.length,
        obstacles:    obstaclesSurRoute,
        recommande:   obstaclesSurRoute.length === 0,
        etapes:       route.legs[0]?.steps?.slice(0, 10).map(s => ({
          instruction: s.maneuver?.instruction || s.name,
          distance_m:  Math.round(s.distance),
          duree_sec:   Math.round(s.duration),
        })) || [],
      };
    });

    // Trier : itinéraire sans obstacle en premier
    routes.sort((a, b) => a.obstacles_detectes - b.obstacles_detectes);

    // Sauvegarder dans l'historique si utilisateur connecté
    // (le token est optionnel pour cette route)

    res.json({
      message: `${routes.length} itinéraire(s) trouvé(s)`,
      depart:  { lat: parseFloat(depart_lat),   lng: parseFloat(depart_lng) },
      arrivee: { lat: parseFloat(arrivee_lat),  lng: parseFloat(arrivee_lng) },
      routes,
    });

  } catch (err) {
    console.error('calculerItineraire:', err);
    res.status(500).json({ message: 'Erreur lors du calcul d\'itinéraire.' });
  }
}

// Vérifie si un point (lat, lng) est à moins de 100m d'une route (liste de coords)
function estSurRoute(lat, lng, coordonnees) {
  const SEUIL_KM = 0.1; // 100 mètres
  return coordonnees.some(([cLng, cLat]) => {
    const d = distanceKm(lat, lng, cLat, cLng);
    return d <= SEUIL_KM;
  });
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── SAUVEGARDER UN TRAJET ──
async function sauvegarderTrajet(req, res) {
  const { depart_lat, depart_lng, depart_nom, arrivee_lat, arrivee_lng, arrivee_nom, duree_min, distance_km } = req.body;

  try {
    await db.execute(
      `INSERT INTO trajets (user_id, depart_lat, depart_lng, depart_nom, arrivee_lat, arrivee_lng, arrivee_nom, duree_min, distance_km)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, depart_lat, depart_lng, depart_nom || null,
       arrivee_lat, arrivee_lng, arrivee_nom || null, duree_min || null, distance_km || null]
    );
    res.status(201).json({ message: 'Trajet sauvegardé ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── HISTORIQUE DES TRAJETS ──
async function historiqueTrajet(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM trajets WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ total: rows.length, trajets: rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { calculerItineraire, sauvegarderTrajet, historiqueTrajet };
