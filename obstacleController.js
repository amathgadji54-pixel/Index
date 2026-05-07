const db = require('./db');

// Durées d'expiration par type d'obstacle (en heures)
const EXPIRATION = {
  accident:        2,
  embouteillage:   2,
  controle_police: 3,
  inondation:      12,
  route_barree:    24,
  travaux:         720, // 30 jours
  autre:           6,
};

// ── LISTER TOUS LES OBSTACLES ACTIFS ──
async function getObstacles(req, res) {
  try {
    // Optionnel : filtrer par zone géographique (lat/lng/rayon)
    const { lat, lng, rayon } = req.query;

    let sql = `
      SELECT o.*, u.nom AS signale_par
      FROM obstacles o
      LEFT JOIN utilisateurs u ON o.user_id = u.id
      WHERE o.statut = 'actif'
        AND (o.expire_at IS NULL OR o.expire_at > NOW())
      ORDER BY o.created_at DESC
    `;

    const [rows] = await db.execute(sql);

    // Filtrage géographique côté serveur si lat/lng fournis
    let result = rows;
    if (lat && lng && rayon) {
      const R = 6371; // rayon Terre en km
      result = rows.filter(obs => {
        const dLat = (obs.latitude  - lat) * Math.PI / 180;
        const dLng = (obs.longitude - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 +
                  Math.cos(lat * Math.PI/180) * Math.cos(obs.latitude * Math.PI/180) *
                  Math.sin(dLng/2)**2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return d <= parseFloat(rayon);
      });
    }

    res.json({ total: result.length, obstacles: result });

  } catch (err) {
    console.error('getObstacles:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── CRÉER UN SIGNALEMENT ──
async function creerObstacle(req, res) {
  const { type, description, latitude, longitude, lieu } = req.body;

  if (!type || !latitude || !longitude) {
    return res.status(400).json({ message: 'type, latitude et longitude sont obligatoires.' });
  }

  const typesValides = Object.keys(EXPIRATION);
  if (!typesValides.includes(type)) {
    return res.status(400).json({
      message: `Type invalide. Valeurs acceptées : ${typesValides.join(', ')}`
    });
  }

  try {
    const heures = EXPIRATION[type] || 6;
    const expireAt = new Date(Date.now() + heures * 3600 * 1000);

    const [result] = await db.execute(
      `INSERT INTO obstacles (type, description, latitude, longitude, lieu, statut, user_id, expire_at)
       VALUES (?, ?, ?, ?, ?, 'en_attente', ?, ?)`,
      [type, description || null, latitude, longitude, lieu || null, req.user.id, expireAt]
    );

    // Ajouter des points à l'utilisateur (+10 par signalement)
    await db.execute(
      'UPDATE utilisateurs SET points = points + 10 WHERE id = ?',
      [req.user.id]
    );

    res.status(201).json({
      message: 'Obstacle signalé ! Merci pour ta contribution 🙏',
      obstacleId: result.insertId,
      expire_dans: `${heures}h`,
    });

  } catch (err) {
    console.error('creerObstacle:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── VOTER SUR UN OBSTACLE (confirmer / infirmer) ──
async function voterObstacle(req, res) {
  const { id } = req.params;
  const { vote } = req.body; // "confirme" ou "infirme"

  if (!['confirme', 'infirme'].includes(vote)) {
    return res.status(400).json({ message: 'vote doit être "confirme" ou "infirme".' });
  }

  try {
    // Vérifier que l'obstacle existe
    const [obs] = await db.execute('SELECT * FROM obstacles WHERE id = ?', [id]);
    if (obs.length === 0) return res.status(404).json({ message: 'Obstacle introuvable.' });

    // Empêcher de voter sur son propre signalement
    if (obs[0].user_id === req.user.id) {
      return res.status(403).json({ message: 'Tu ne peux pas voter sur ton propre signalement.' });
    }

    // Enregistrer le vote (UNIQUE KEY empêche le double vote)
    await db.execute(
      'INSERT INTO votes_obstacles (obstacle_id, user_id, vote) VALUES (?, ?, ?)',
      [id, req.user.id, vote]
    );

    // Mettre à jour les compteurs
    const col = vote === 'confirme' ? 'confirmations' : 'infirmations';
    await db.execute(
      `UPDATE obstacles SET ${col} = ${col} + 1 WHERE id = ?`, [id]
    );

    // Si 2+ confirmations → passer à "actif"
    const [updated] = await db.execute('SELECT * FROM obstacles WHERE id = ?', [id]);
    const o = updated[0];

    if (o.confirmations >= 2 && o.statut === 'en_attente') {
      await db.execute("UPDATE obstacles SET statut = 'actif' WHERE id = ?", [id]);
    }

    // Si beaucoup d'infirmations → supprimer
    if (o.infirmations >= 5) {
      await db.execute("UPDATE obstacles SET statut = 'resolu' WHERE id = ?", [id]);
    }

    res.json({ message: `Vote "${vote}" enregistré !`, confirmations: o.confirmations, infirmations: o.infirmations });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Tu as déjà voté sur cet obstacle.' });
    }
    console.error('voterObstacle:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── MARQUER UN OBSTACLE COMME RÉSOLU ──
async function resoudreObstacle(req, res) {
  const { id } = req.params;

  try {
    const [obs] = await db.execute('SELECT * FROM obstacles WHERE id = ?', [id]);
    if (obs.length === 0) return res.status(404).json({ message: 'Obstacle introuvable.' });

    // Seul le créateur ou un admin peut résoudre
    if (obs[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé.' });
    }

    await db.execute("UPDATE obstacles SET statut = 'resolu' WHERE id = ?", [id]);
    res.json({ message: 'Obstacle marqué comme résolu ✅' });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ── OBTENIR UN OBSTACLE PAR ID ──
async function getObstacleById(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT o.*, u.nom AS signale_par
       FROM obstacles o LEFT JOIN utilisateurs u ON o.user_id = u.id
       WHERE o.id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Obstacle introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { getObstacles, creerObstacle, voterObstacle, resoudreObstacle, getObstacleById };
