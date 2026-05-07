const express = require('express');
const router  = express.Router();
const {
  getObstacles, creerObstacle, voterObstacle, resoudreObstacle, getObstacleById
} =
 require('./obstacleController');
const { authMiddleware } = require('./auth')
;

// GET  /api/obstacles           → liste tous les obstacles actifs (public)
router.get('/', getObstacles);

// GET  /api/obstacles/:id       → détail d'un obstacle (public)
router.get('/:id', getObstacleById);

// POST /api/obstacles           → signaler un obstacle (connecté)
router.post('/', authMiddleware, creerObstacle);

// POST /api/obstacles/:id/vote  → voter confirme/infirme (connecté)
router.post('/:id/vote', authMiddleware, voterObstacle);

// PUT  /api/obstacles/:id/resoudre → marquer résolu (créateur ou admin)
router.put('/:id/resoudre', authMiddleware, resoudreObstacle);

module.exports = router;
