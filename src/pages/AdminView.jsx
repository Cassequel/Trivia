import React, { useState, useEffect } from "react";
import socket from "../socket";

export default function AdminView() {
  const [teams, setTeams] = useState({});
  const [roundActive, setRoundActive] = useState(false);
  const [roundId, setRoundId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [pointInputs, setPointInputs] = useState({});

  useEffect(() => {
    socket.on("teams-updated", (data) => {
      setTeams(data);
    });

    socket.on("round-started", ({ roundId }) => {
      setRoundId(roundId);
      setRoundActive(true);
      setSubmissions([]);
    });

    socket.on("round-ended", () => {
      setRoundActive(false);
    });

    socket.on("submission-received", (submission) => {
      setSubmissions((prev) => [...prev, submission]);
    });

    socket.on("all-submissions", (subs) => {
      if (subs?.length) setSubmissions(subs);
    });

    socket.on("game-reset", () => {
      setTeams({});
      setRoundActive(false);
      setRoundId(null);
      setSubmissions([]);
      setPointInputs({});
    });

    return () => {
      socket.off("teams-updated");
      socket.off("round-started");
      socket.off("round-ended");
      socket.off("submission-received");
      socket.off("all-submissions");
      socket.off("game-reset");
    };
  }, []);

  const startRound = () => socket.emit("admin:start-round");
  const endRound = () => socket.emit("admin:end-round");
  const resetGame = () => {
    if (window.confirm("Reset the entire game? All scores will be lost.")) {
      socket.emit("admin:reset-game");
    }
  };

  const awardPoints = (teamName) => {
    const points = Number(pointInputs[teamName]);
    if (isNaN(points)) return;
    socket.emit("admin:award-points", { teamName, points });
    setPointInputs((prev) => ({ ...prev, [teamName]: "" }));
  };

  const teamNames = Object.keys(teams);

  return (
    <div className="view admin-view">
      <div className="admin-header">
        <h1>👑 Admin Panel</h1>
        <div className="admin-controls">
          {!roundActive ? (
            <button onClick={startRound} className="btn btn-primary">
              ▶️ Start Round {(roundId || 0) + 1}
            </button>
          ) : (
            <button onClick={endRound} className="btn btn-danger">
              ⏹️ End Round {roundId}
            </button>
          )}
          <button onClick={resetGame} className="btn btn-ghost">
            🔄 Reset Game
          </button>
        </div>
      </div>

      <div className="admin-grid">
        {/* Teams panel */}
        <div className="panel">
          <h2>Teams ({teamNames.length})</h2>
          {teamNames.length === 0 ? (
            <p className="muted">No teams yet. Players will appear here when they join.</p>
          ) : (
            <div className="team-list">
              {teamNames.map((name) => (
                <div key={name} className="team-card">
                  <div className="team-info">
                    <strong>{name}</strong>
                    <span className="badge">{teams[name].score} pts</span>
                  </div>
                  <div className="team-players">
                    {teams[name].players.map((p) => (
                      <span key={p} className="player-tag">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="points-row">
                    <input
                      type="number"
                      placeholder="Points"
                      value={pointInputs[name] || ""}
                      onChange={(e) =>
                        setPointInputs((prev) => ({
                          ...prev,
                          [name]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && awardPoints(name)}
                    />
                    <button
                      onClick={() => awardPoints(name)}
                      className="btn btn-sm btn-primary"
                    >
                      Award
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submissions panel */}
        <div className="panel">
          <h2>
            Submissions
            {roundActive && <span className="live-badge">● LIVE</span>}
            {submissions.length > 0 && (
              <span className="count-badge">{submissions.length}</span>
            )}
          </h2>
          {submissions.length === 0 ? (
            <p className="muted">
              {roundActive
                ? "Waiting for submissions..."
                : "Start a round to see submissions."}
            </p>
          ) : (
            <div className="submissions-list">
              {submissions.map((s, i) => (
                <div key={i} className="submission-card">
                  <div className="submission-header">
                    <span className="order-badge">#{s.order}</span>
                    <strong>{s.player}</strong>
                    <span className="team-label">{s.team}</span>
                    <span className="time">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="submission-answer">{s.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
