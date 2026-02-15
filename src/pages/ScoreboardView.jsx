import React, { useState, useEffect } from "react";
import socket from "../socket";

export default function ScoreboardView() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    socket.on("scores-updated", (data) => {
      setLeaderboard(data);
    });

    socket.on("game-reset", () => {
      setLeaderboard([]);
    });

    return () => {
      socket.off("scores-updated");
      socket.off("game-reset");
    };
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="view scoreboard-view">
      <h1>📊 Scoreboard</h1>

      {leaderboard.length === 0 ? (
        <p className="muted large">Waiting for teams to join...</p>
      ) : (
        <div className="leaderboard">
          {leaderboard.map((team, i) => (
            <div
              key={team.name}
              className={`leaderboard-row ${i < 3 ? "top-" + (i + 1) : ""}`}
            >
              <span className="rank">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <span className="team-name">{team.name}</span>
              <span className="team-score">{team.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
