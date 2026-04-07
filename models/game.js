const mongoose = require('mongoose');
const { type } = require('os');


const PlayerSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // later: real User._id
  displayName: { type: String, required: true },
  hand: [{ 
    left: Number,
    right: Number
  
  }], 

  wins: { type: Number, default: 0 },      // how many rounds this player has won
  points: { type: Number, default: 0 },    // for 150 or points modes later
  isActive: { type: Boolean, default: true },
}, { _id: false });

const GameSchema = new mongoose.Schema({ 
    mode: {
        type: String,
         enum: ['cutthroat', 'draw', 'points150'],
         default: 'cutthroat'
    },
    status: {
        type: String,
         enum: ['waiting', 'in_progress', 'completed'],
         default: 'waiting',
        },
    phase:{
      type: String,
      enum: ['dealing', 'playing', 'round_end',],
      default: 'playing'
    },
    
    leftEnd: {type: Number, default: nulll},
    rightEnd: {type: Number, default: null},

    board: [{
      left: Number,
      right: Number,
      playedBy: String,
      side: {type: String, enum: ['left', 'right']}
    }
    ],
    ownerUserId: { type: String, required: true },
    players: { type: [PlayerSchema], default: [] },
    maxPlayers: { type: Number, default: 4 },

    currentTurnIndex: { type: Number, default: 0 },
    //board: { type: [[Number]], default: [] },   // placed tiles in order
    boneyard: { type: [[Number]], default: [] },// remaining tiles

   
    roundNumber: { type: Number, default: 0 },
    targetWins: { type: Number, default: 6 },  // for cutthroat “6ix”

    matchWinnerUserId: { type: String },
    sixedPlayerIds: { type: [String], default: [] },
    lastRoundWinnerUserId: { type: String },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    moves: [
      {
        userId: String,
        tile: {
          left: Number,
          right: Number
        },
        side: {type: String, enum: ['left', 'right']},
        turnIndex: Number,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // for inbox ordering / metadata
    lastMoveAt: { type: Date, default: Date.now },

}, { timestamps: true } );

module.exports = mongoose.model('Game', GameSchema);