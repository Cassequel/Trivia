class GameState {
  constructor() {
    this.teams = {}; // { teamName: { score: 0, players: Set } }
    this.currentRound = null; // { id, active, submissions: [] }
    this.roundCount = 0;
    this.playerMap = new Map(); // socketId -> { name, team }
  }

  addTeam(teamName) {
    if (!this.teams[teamName]) {
      this.teams[teamName] = { score: 0, players: new Set() };
    }
    return this.teams[teamName];
  }

  joinTeam(socketId, playerName, teamName) {
    this.addTeam(teamName);
    this.teams[teamName].players.add(playerName);
    this.playerMap.set(socketId, { name: playerName, team: teamName });
  }

  removePlayer(socketId) {
    const player = this.playerMap.get(socketId);
    if (player && this.teams[player.team]) {
      this.teams[player.team].players.delete(player.name);
      if (this.teams[player.team].players.size === 0) {
        // Keep team even if empty (they might have points)
      }
    }
    this.playerMap.delete(socketId);
  }

  startRound() {
    this.roundCount++;
    this.currentRound = {
      id: this.roundCount,
      active: true,
      submissions: [],
    };
    return this.currentRound;
  }

  endRound() {
    if (this.currentRound) {
      this.currentRound.active = false;
    }
    return this.currentRound;
  }

  submitAnswer(socketId, answer) {
    const player = this.playerMap.get(socketId);
    if (!player || !this.currentRound || !this.currentRound.active) return null;

    // Check if this player already submitted this round
    const alreadySubmitted = this.currentRound.submissions.find(
      (s) => s.player === player.name && s.team === player.team
    );
    if (alreadySubmitted) return null;

    const submission = {
      player: player.name,
      team: player.team,
      answer,
      timestamp: Date.now(),
      order: this.currentRound.submissions.length + 1,
    };
    this.currentRound.submissions.push(submission);
    return submission;
  }

  awardPoints(teamName, points) {
    if (this.teams[teamName]) {
      this.teams[teamName].score += points;
      return true;
    }
    return false;
  }

  getTeamsData() {
    const data = {};
    for (const [name, team] of Object.entries(this.teams)) {
      data[name] = {
        score: team.score,
        players: Array.from(team.players),
      };
    }
    return data;
  }

  getLeaderboard() {
    return Object.entries(this.teams)
      .map(([name, team]) => ({ name, score: team.score }))
      .sort((a, b) => b.score - a.score);
  }

  getPlayer(socketId) {
    return this.playerMap.get(socketId) || null;
  }
}

module.exports = GameState;
