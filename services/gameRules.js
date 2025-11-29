function createDeck(maxPip = 6) {
  const deck = [];
  for (let i = 0; i <= maxPip; i++) {
    for (let j = i; j <= maxPip; j++) {
      deck.push([i, j]);
    }
  }
  return deck;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function deal(deck, numPlayers, handSize) {
  const hands = [];
  let index = 0;
  for (let p = 0; p < numPlayers; p++) {
    hands[p] = [];
    for (let h = 0; h < handSize; h++) {
      hands[p].push(deck[index++]);
    }
  }
  const boneyard = deck.slice(index);
  return { hands, boneyard };
}

function defaultHandSize(mode) {
  switch (mode) {
    case 'cutthroat':
      return 7;
    case 'draw':
      return 5;
    case 'points':
      return 7;
    default:
      return 7;
  }
}

function canPlay(tile, board) {
  if (board.length === 0) return true;

  const [leftEndA] = board[0];
  const [, rightEndB] = board[board.length - 1];

  const [a, b] = tile;
  return a === leftEndA || b === leftEndA || a === rightEndB || b === rightEndB;
}

function placeTile(tile, board, end) {
  const [a, b] = tile;

  if (board.length === 0) {
    return [[a, b]];
  }

  const [leftEndA] = board[0];
  const [, rightEndB] = board[board.length - 1];

  if (end === 'left') {
    if (b === leftEndA) return [[a, b], ...board];
    if (a === leftEndA) return [[b, a], ...board];
  } else if (end === 'right') {
    if (a === rightEndB) return [...board, [a, b]];
    if (b === rightEndB) return [...board, [b, a]];
  }

  throw new Error('Invalid tile placement');
}

module.exports = {
  createDeck,
  shuffle,
  deal,
  defaultHandSize,
  canPlay,
  placeTile,
};
