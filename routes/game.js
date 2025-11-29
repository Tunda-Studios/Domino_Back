const router = require('express').Router();
//const optionalAuth = require('../middleware/optionalAuth');
const gameService = require('../services/gameService');
const Game = require('../models/game');


//router.use(optionalAuth);

// 🔹 DEBUG: quick test route → GET /api/ping
router.get('/ping', (req, res) => {
  console.log('in /api/ping, req.userId =', req.userId);
  res.json({ ok: true, userId: req.userId || null });
});

router.post('/games', async (req, res) => {
  try {
    const game = await gameService.createGame({
      mode: req.body.mode,
      ownerUserId: req.userId,
      ownerName: req.body.displayName,
      maxPlayers: req.body.maxPlayers || 4
    });
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// LIST games -> GET /api/games
router.get('/games', async (req, res) => {
   console.log("User ID:", req.userId);
  try {

   
    const games = await Game.find({ 'players.userId': req.userId })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ games });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET one -> GET /api/games/:id
router.get('/games/:id', async (req, res) => {
  const game = await Game.findById(req.params.id);
  res.json(game);
});

router.post('/games/:id/join', async (req, res) => {
  try {
    const game = await gameService.joinGame({
      gameId: req.params.id,
      userId: req.userId,
      displayName: req.body.displayName
    });
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/games/:id/start', async (req, res) => {
  try {
    const game = await gameService.startGame(req.params.id);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/games/:id/move', async (req, res) => {
  try {
    const game = await gameService.playMove({
      gameId: req.params.id,
      userId: req.userId,
      tile: req.body.tile,
      end: req.body.end
    });
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/a', async (req, res) => {
   res.send("game route reach");
});

router.get('/:id', async (req, res) => {
  const game = await Game.findById(req.params.id);
  res.json(game);
});



module.exports = router;