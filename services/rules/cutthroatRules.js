const rules = require('../gameRules');

const Max_PIP = 6;

module.exports = {
   initMatch(game) {
    game.targetWins = 6;                 // play to 6
    game.roundNumber = 0;
    game.lastRoundWinnerUserId = undefined;
    game.matchWinnerUserId = undefined;
    game.sixedPlayerIds = [];
    game._roundWinnerUserId = undefined;
    game._roundWinnerReason = undefined;
  },
//Round Setup 

 // Each time a new round starts
  initRound(game) {
    const deck = rules.shuffle(rules.createDeck(MAX_PIP));
    const handSize = rules.defaultHandSize('cutthroat');
    const { hands, boneyard } = rules.deal(deck, game.players.length, handSize);

    game.players.forEach((p, i) => {
      p.hand = hands[i];
    });

    game.boneyard = boneyard;
    game.board = [];

    const isFirstRound = game.roundNumber === 0;
    game.roundNumber += 1;

    let starterIndex = 0;

    if (isFirstRound) {
      // FIRST ROUND: player with [6,6] starts
      const D6 = JSON.stringify([6, 6]);
      for (let i = 0; i < game.players.length; i++) {
        const hasD6 = game.players[i].hand.some(
          (t) => JSON.stringify(t) === D6
        );
        if (hasD6) {
          starterIndex = i;
          break;
        }
      }
    } else {
      // LATER ROUNDS
      if (game.lastRoundWinnerUserId) {
        // last real winner starts
        const idx = game.players.findIndex(
          (p) => p.userId === game.lastRoundWinnerUserId
        );
        if (idx !== -1) {
          starterIndex = idx;
        }
      } else {
        // previous round was a void lock → double six starts again
        const D6 = JSON.stringify([6, 6]);
        for (let i = 0; i < game.players.length; i++) {
          const hasD6 = game.players[i].hand.some(
            (t) => JSON.stringify(t) === D6
          );
          if (hasD6) {
            starterIndex = i;
            break;
          }
        }
      }
    }

    game.currentTurnIndex = starterIndex;
    game.status = 'in_progress';

    // clear temp round stuff
    game._roundWinnerUserId = undefined;
    game._roundWinnerReason = undefined;
  },

  // Apply a single move
  // move: { userId, tile: [a,b] | null (pass), end: "left" | "right" }
  handleMove(game, { userId, tile, end }) {
    if (game.status !== 'in_progress') {
      throw new Error('Game not in progress');
    }

    const currentPlayer = game.players[game.currentTurnIndex];
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    // PASS / blocked (no tile)
    if (!tile) {
      game.currentTurnIndex =
        (game.currentTurnIndex + 1) % game.players.length;
      return;
    }

    const tileStr = JSON.stringify(tile);
    const handIndex = currentPlayer.hand.findIndex(
      (t) => JSON.stringify(t) === tileStr
    );
    if (handIndex === -1) throw new Error('Tile not in hand');
    if (!rules.canPlay(tile, game.board)) throw new Error('Tile cannot be played');

    // play tile
    game.board = rules.placeTile(tile, game.board, end);
    currentPlayer.hand.splice(handIndex, 1);

    // BREAK OUT (no tiles left) → instant round winner
    if (currentPlayer.hand.length === 0) {
      game._roundWinnerUserId = currentPlayer.userId;
      game._roundWinnerReason = 'breakout';
      return;
    }

    // otherwise, next turn
    game.currentTurnIndex =
      (game.currentTurnIndex + 1) % game.players.length;
  },

  // Check if the round is over (breakout or lock)
  checkRoundOver(game) {
    // Case 1: someone already won by breakout
    if (game._roundWinnerUserId && game._roundWinnerReason === 'breakout') {
      return {
        isOver: true,
        winnerUserId: game._roundWinnerUserId,
        reason: 'breakout',
      };
    }

    // Case 2: check for lock (no one can play)
    const anyPlayable = game.players.some((p) =>
      p.hand.some((tile) => rules.canPlay(tile, game.board))
    );

    if (!anyPlayable) {
      // LOCK: find lowest pip total
      let lowestSum = Infinity;
      let lowestPlayer = null;

      for (const p of game.players) {
        const sum = p.hand.reduce((acc, t) => acc + t[0] + t[1], 0);
        if (sum < lowestSum) {
          lowestSum = sum;
          lowestPlayer = p;
        }
      }

      const hasPriorWins = (lowestPlayer.wins || 0) > 0;

      if (hasPriorWins) {
        // lock-valid: lowest hand & they already had at least 1 win
        game._roundWinnerUserId = lowestPlayer.userId;
        game._roundWinnerReason = 'lock-valid';
        return {
          isOver: true,
          winnerUserId: lowestPlayer.userId,
          reason: 'lock-valid',
        };
      } else {
        // lock-void: lowest player has 0 wins → no point awarded
        game._roundWinnerUserId = null;
        game._roundWinnerReason = 'lock-void';
        return {
          isOver: true,
          winnerUserId: null,
          reason: 'lock-void',
        };
      }
    }

    // Round not finished
    return { isOver: false };
  },

  // Called once after each round ends
  // Decides: update wins? match finished? who starts next?
  checkMatchOver(game) {
    const reason = game._roundWinnerReason;

    // If no result stored, nothing to do
    if (typeof reason === 'undefined') {
      return { isOver: false };
    }

    // CASE A: lock-void → no winner, next round double six again
    if (reason === 'lock-void') {
      game.lastRoundWinnerUserId = undefined;
      game._roundWinnerUserId = undefined;
      game._roundWinnerReason = undefined;
      return { isOver: false };
    }

    // CASE B: breakout or lock-valid → real winner
    const winnerUserId = game._roundWinnerUserId;
    const winner = game.players.find((p) => p.userId === winnerUserId);
    if (!winner) {
      // should not happen, but be safe
      game._roundWinnerUserId = undefined;
      game._roundWinnerReason = undefined;
      return { isOver: false };
    }

    // Give them a win
    winner.wins = (winner.wins || 0) + 1;

    // They start next round
    game.lastRoundWinnerUserId = winner.userId;

    // Clear round temp
    game._roundWinnerUserId = undefined;
    game._roundWinnerReason = undefined;

    // Check if match is over (first to targetWins)
    if (winner.wins >= (game.targetWins || 6)) {
      const sixed = game.players
        .filter((p) => (p.wins || 0) === 0)
        .map((p) => p.userId);

      game.matchWinnerUserId = winner.userId;
      game.sixedPlayerIds = sixed;

      return {
        isOver: true,
        winnerUserId: winner.userId,
        sixedPlayerIds: sixed,
        reason: 'first-to-6',
      };
    }

    // Match continues
    return { isOver: false };
  },
};