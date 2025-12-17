global.__basedir = __dirname;
const express = require('express');
const app = express();
require("dotenv").config();

const http = require("http"); 
const { WebSocket } = require("ws"); 
const gameEvents = require("./events/gameEvents");

// get config
const config = require(__basedir + "/config");
const { PORT: port } = config;
require(__basedir + "/helpers/mongoose");

//connect to the database
const mongoose = require('mongoose');

const gameRouter = require('./routes/game');
const { type } = require('os');

app.use(express.json());

app.use((req, res, next) => {
  console.log("====== NEW REQUEST ======");
  console.log(req.method, req.url);
  console.log("All headers:", req.headers);
  const userId = req.header('x-user-id'); 
  console.log("Middleware - x-user-id:", userId);
  if (userId) {
    req.userId = userId;
  }
  next();
});
app.use('/api', gameRouter);

app.get("/", (req, res) => {
  res.send("Node.js server is running!");
});

app.get("/test-db", async (req, res) => {
  try {
    const status = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({ mongoStatus: status });
  } catch (err) {
    res.json({ mongoStatus: "error", error: err.message });
  }
});

app.get('/debug/mongo', (req, res) => {
  const conn = mongoose.connection;
  res.json({
    host: conn.host,
    port: conn.port,
    dbName: conn.name
  });
});

app.get('/debug/games-all', async (req, res) => {
  console.log("Fetching all games for debug");
  try {
    const games = await Game.find().limit(10);
    res.json({ count: games.length, games });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

//create http server + websockets
const server = http.createServer(app);

//create websocket server
const wss = new WebSocket.Server({ server });

console.log("WebSocket server created");

//handle websocket connections
wss.on('connection', (ws) => {
  console.log("🔌 A client connected via WebSocket");
  ws.on("close", () => console.log("❌ Client disconnected"));
});

//broadcast game updates

gameEvents.on("Update", (game) => {
const json = JSON.stringify({type: "Update", game: game});
});

 console.log("📣 Broadcasting update to clients...");

 wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(json);
    }
  });



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
