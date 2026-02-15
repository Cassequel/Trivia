const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const GameState = require("./gameState");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const game = new GameState();

// Serve static React build in production
app.use(express.static(path.join(__dirname, "../dist")));

// Broadcast helpers
function broadcastTeams() {
  io.emit("teams-updated", game.getTeamsData());
}

function broadcastLeaderboard() {
  io.emit("scores-updated", game.getLeaderboard());
}

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit("teams-updated", game.getTeamsData());
  socket.emit("scores-updated", game.getLeaderboard());
  if (game.currentRound) {
    if (game.currentRound.active) {
      socket.emit("round-started", { roundId: game.currentRound.id });
    }
    // Send existing submissions to admin
    socket.emit("all-submissions", game.currentRound.submissions);
  }

  // --- Player events ---

  socket.on("join-team", ({ teamName }, callback) => {
    if (!teamName?.trim()) {
      return callback?.({ error: "Team name is required" });
    }

    game.joinTeam(socket.id, teamName.trim(), teamName.trim());
    console.log(`Team ${teamName} joined`);
    broadcastTeams();
    callback?.({ success: true });
  });

  socket.on("submit-answer", ({ answer }, callback) => {
    const submission = game.submitAnswer(socket.id, answer);
    if (!submission) {
      return callback?.({ error: "Cannot submit right now" });
    }

    console.log(`Submission #${submission.order} from ${submission.player} (${submission.team})`);

    // Notify admin screens of the new submission
    io.emit("submission-received", submission);
    callback?.({ success: true, order: submission.order });
  });

  socket.on("admin:request-state", () => {
    socket.emit("teams-updated", game.getTeamsData());
    socket.emit("scores-updated", game.getLeaderboard());
    if (game.currentRound) {
      if (game.currentRound.active) {
        socket.emit("round-started", { roundId: game.currentRound.id, duration: 0 });
      } else {
        socket.emit("round-ended");
      }
      socket.emit("all-submissions", game.currentRound.submissions);
    }
  });

  // --- Admin events ---

  socket.on("admin:start-round", ({ duration } = {}) => {
    const round = game.startRound();
    console.log(`Round ${round.id} started`);
    io.emit("round-started", { roundId: round.id, duration: duration || 0 });
  });

  socket.on("admin:end-round", () => {
    game.endRound();
    console.log("Round ended");
    io.emit("round-ended");
  });

  socket.on("admin:award-points", ({ teamName, points }) => {
    const numPoints = Number(points);
    if (game.awardPoints(teamName, numPoints)) {
      console.log(`Awarded ${numPoints} points to ${teamName}`);
      broadcastTeams();
      broadcastLeaderboard();
    }
  });

  socket.on("admin:reset-game", () => {
    // Full reset
    game.teams = {};
    game.currentRound = null;
    game.roundCount = 0;
    game.playerMap = new Map();
    console.log("Game reset");
    broadcastTeams();
    broadcastLeaderboard();
    io.emit("game-reset");
  });

  // --- Disconnect ---

  socket.on("disconnect", () => {
    const player = game.getPlayer(socket.id);
    if (player) {
      console.log(`${player.name} disconnected`);
    }
    game.removePlayer(socket.id);
    broadcastTeams();
  });
});

// SPA fallback — serve index.html for all non-API routes
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
