const notifyTurn = (userId, game) => {
  console.log(
    `🔔 TURN ALERT → User ${userId} | Game ${game._id} | Mode: ${game.mode}`
  );

  // TODO: integrate REAL notifications:
  // OneSignal.sendPush(userId, ...)
  // FirebaseMessaging.send(...)
  // Email / SMS
};

module.exports = notifyTurn;