// seedFakeData.js (put this in Domino_Back root)

require("dotenv").config();

// Make __basedir available just like in your main server
global.__basedir = __dirname;

// Use your existing mongoose connection logic
require(__basedir + "/helpers/mongoose");

const mongoose = require("mongoose");
const User = require("./models/user");
const Game = require("./models/game");

// ---------- LOCAL DOMINO HELPERS (NO gameRules, NO rules.createDeck) ----------

// Create a standard double-6 deck: [0,0]..[0,6]..[6,6]
function createDeck6() {
  const deck = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      deck.push([i, j]);
    }
  }
  return deck;
}

// Simple Fisher–Yates shuffle
function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Deal `handSize` tiles to `playerCount` players
function dealTiles(deck, playerCount, handSize) {
  const hands = [];
  let idx = 0;
  for (let p = 0; p < playerCount; p++) {
    hands[p] = [];
    for (let h = 0; h < handSize; h++) {
      hands[p].push(deck[idx++]);
    }
  }
  const boneyard = deck.slice(idx);
  return { hands, boneyard };
}

// ---------- FAKE USERS ----------

const fakeUsers = [
  {
    id: "u1",
    firstName: "Rachad",
    lastName: "Quintyne",
    displayName: "Rachad",
    username: "rachad01",
    email: "rachad@test.com",
    password: "password",
    isVerified: true
  },
  {
    id: "u2",
    firstName: "Player",
    lastName: "Two",
    displayName: "P2",
    username: "p2",
    email: "p2@test.com",
    password: "password",
    isVerified: true
  },
  {
    id: "u3",
    firstName: "Player",
    lastName: "Three",
    displayName: "P3",
    username: "p3",
    email: "p3@test.com",
    password: "password",
    isVerified: true
  },
  {
    id: "u4",
    firstName: "Player",
    lastName: "Four",
    displayName: "P4",
    username: "p4",
    email: "p4@test.com",
    password: "password",
    isVerified: true
  }
];

// Wait until your existing mongoose connection is up
async function waitForMongo() {
  return new Promise((resolve) => {
    const check = () => {
      if (mongoose.connection.readyState === 1) {
        console.log("✅ MongoDB connected!");
        resolve();
      } else {
        console.log("⏳ Waiting for MongoDB connection...");
        setTimeout(check, 500);
      }
    };
    check();
  });
}

async function seedUsers() {
  console.log("🧹 Clearing Users...");
  await User.deleteMany({});

  console.log("👤 Creating Fake Users...");
  for (const data of fakeUsers) {
    const user = new User(data);
    await user.save();
  }

  console.log("✔ Users created:", fakeUsers.length);
}

async function createFakeCutthroatGame() {
  console.log("🎮 Creating fake Cutthroat game...");

  const playerCount = fakeUsers.length;
  const handSize = 7;

  // Build & shuffle deck locally
  const deck = shuffleDeck(createDeck6());
  const { hands, boneyard } = dealTiles(deck, playerCount, handSize);

  const game = new Game({
    mode: "cutthroat",
    status: "in_progress",
    ownerUserId: "u1",
    maxPlayers: playerCount,
    targetWins: 6,
    roundNumber: 1,
    players: fakeUsers.map((u, i) => ({
      userId: u.id,
      displayName: u.displayName,
      hand: hands[i],
      wins: 0,
      isActive: true
    })),
    boneyard,
    board: []
  });

  // Find double six starter
  const D6 = JSON.stringify([6, 6]);
  let starterIndex = 0;

  for (let i = 0; i < game.players.length; i++) {
    const hasD6 = game.players[i].hand.some(
      (t) => JSON.stringify(t) === D6
    );
    if (hasD6) {
      starterIndex = i;
      break;
    }
  }

  game.currentTurnIndex = starterIndex;

  await game.save();

  console.log("=======================================");
  console.log("✔ GAME SEEDED");
  console.log("Game ID:", game._id.toString());
  console.log("Starter:", game.players[starterIndex].displayName);
  console.log("=======================================");

  return game;
}

async function run() {
  try {
    await waitForMongo();

    await seedUsers();

    console.log("🧹 Clearing Games...");
    await Game.deleteMany({});

    await createFakeCutthroatGame();

    console.log("🌱 Seed Complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder Error:", err);
    process.exit(1);
  }
}

run();
