const router = require('express').Router();
//const optionalAuth = require('../middleware/optionalAuth');
const gameService = require('../services/gameService');
const Game = require('../models/game');
const gameEvents = require("../events/gameEvents");
const notifyTurn  = require('../helpers/notifs');

//router.use(optionalAuth);

// 🔔 stub – later you can hook into FCM / OneSignal
async function sendTurnNotification(userId, game) {
  console.log(`🔔 [NOTIFY] It is now user ${userId}'s turn in game ${game._id}`);
  // TODO: integrate with FCM / OneSignal / email / whatever
}

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

    gameEvents.emit("update", game);

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

    gameEvents.emit("update", game);
    
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/games/:id/start', async (req, res) => {
  try {
    const game = await gameService.startGame(req.params.id);

     // ⭐ Broadcast
    gameEvents.emit("update", game);

    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/games/:id/move', async (req, res) => {
   try {
    const { tile, end } = req.body;

    // 1️⃣ Play move using your game service (your rules module used inside)
    let game = await gameService.playMove({
      gameId: req.params.id,
      userId: req.userId,
      tile,
      end
    });

    // Reload fresh version (to include rule-based updates)
    game = await Game.findById(req.params.id);

    // 2️⃣ Append move to history
    game.moves.push({
      userId: req.userId,
      tile,
      end,
      createdAt: new Date()
    });

    // 3️⃣ Update inbox sorting
    game.lastMoveAt = new Date();

    // 4️⃣ Determine next player after your rules update game.currentTurnIndex
    const next = game.players[game.currentTurnIndex];

    // Save database changes
    await game.save();

    // 5️⃣ Notify the next player (if they are not the mover)
    if (next && next.userId !== req.userId) {
      notifyTurn(next.userId, game);    // we implement below
    }

    // 6️⃣ Broadcast to that game's websocket room
    gameEvents.emit("update", game);

    res.json(game);
  }
  catch (e) {
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

// GET /api/games/inbox
router.get('/games-inbox', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Missing x-user-id" });
    }

    const games = await Game.find({ 'players.userId': userId })
      .sort({ lastMoveAt: -1 })
      .limit(100);

    // Map to a light-weight inbox DTO
    const result = games.map(g => {
      const currentPlayer = g.players[g.currentTurnIndex];
      const myTurn = currentPlayer && currentPlayer.userId === userId;

      const opponentNames = g.players
        .filter(p => p.userId !== userId)
        .map(p => p.displayName || p.userId);

      return {
        _id: g._id,
        mode: g.mode,
        status: g.status,
        myTurn,
        opponentNames,
        lastMoveAt: g.lastMoveAt || g.updatedAt,
        lastRoundWinnerUserId: g.lastRoundWinnerUserId || null
      };
    });

    res.json({ games: result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/games/:id/history', async (req, res) => {
  const game = await Game.findById(req.params.id, { moves: 1 });
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.json({ moves: game.moves });
});



module.exports = router;