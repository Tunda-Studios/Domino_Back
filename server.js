global.__basedir = __dirname;
const express = require('express');
const app = express();
require("dotenv").config();

// get config
const config = require(__basedir + "/config");
const { PORT: port } = config;
require(__basedir + "/helpers/mongoose");

//connect to the database
const mongoose = require('mongoose');
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
