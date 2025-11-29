const {getRules} = require('./rules')
const Game = require('../models/game');

async function createGame({ mode, ownerUserId, ownerName, maxPlayers }) {
  const game = new Game({
    mode,
    ownerUserId,
    maxPlayers,
    players: [{ userId: ownerUserId, displayName: ownerName, wins: 0 }]
  });

  await game.save();
  return game;
}

async function joinGame({ gameId, userId, displayName }) {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");
  if (game.players.length >= game.maxPlayers) throw new Error("Game full");

  game.players.push({ userId, displayName, wins: 0 });
  await game.save();
  return game;
}

async function startGame(gameId) {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");

  const rules = getRules(game.mode);
  rules.initMatch(game);
  rules.initRound(game);

  await game.save();
  return game;
}

async function playMove({ gameId, userId, tile, end }) {
  const game = await Game.findById(gameId);
  if (!game) throw new Error("Game not found");

  const rules = getRules(game.mode);

  rules.handleMove(game, { userId, tile, end });

  const roundCheck = rules.checkRoundOver(game);
  if (roundCheck.isOver) {
    const matchCheck = rules.checkMatchOver(game);

    if (matchCheck.isOver) {
      game.status = 'finished';
      game.matchWinnerUserId = matchCheck.winnerUserId;
      game.sixedPlayerIds = matchCheck.sixedPlayerIds || [];
    } else {
      rules.initRound(game);
    }
  }

  await game.save();
  return game;
}

module.exports = {
  createGame, joinGame, startGame, playMove
};