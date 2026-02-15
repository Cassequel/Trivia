import React, { useState, useEffect } from "react";
import socket from "../socket";

export default function PlayerView() {
  const [joined, setJoined] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  const [roundActive, setRoundActive] = useState(false);
  const [roundId, setRoundId] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitOrder, setSubmitOrder] = useState(null);

  useEffect(() => {
    socket.on("round-started", ({ roundId }) => {
      setRoundId(roundId);
      setRoundActive(true);
      setSubmitted(false);
      setSubmitOrder(null);
      setAnswer("");
    });

    socket.on("round-ended", () => {
      setRoundActive(false);
    });

    socket.on("game-reset", () => {
      setJoined(false);
      setRoundActive(false);
      setSubmitted(false);
      setAnswer("");
      setPlayerName("");
      setTeamName("");
    });

    return () => {
      socket.off("round-started");
      socket.off("round-ended");
      socket.off("game-reset");
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    setError("");
    socket.emit("join-team", { playerName, teamName }, (res) => {
      if (res?.error) {
        setError(res.error);
      } else {
        setJoined(true);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    socket.emit("submit-answer", { answer: answer.trim() }, (res) => {
      if (res?.success) {
        setSubmitted(true);
        setSubmitOrder(res.order);
      }
    });
  };

  // --- Join screen ---
  if (!joined) {
    return (
      <div className="view player-view">
        <h1>🙋 Join the Game</h1>
        <form onSubmit={handleJoin} className="join-form">
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            autoFocus
            required
          />
          <input
            type="text"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Join
          </button>
        </form>
      </div>
    );
  }

  // --- Waiting screen ---
  if (!roundActive && !submitted) {
    return (
      <div className="view player-view">
        <div className="status-card">
          <h2>
            {playerName} — Team {teamName}
          </h2>
          <div className="waiting-animation">
            <div className="pulse-dot"></div>
          </div>
          <p className="waiting-text">Waiting for the next round...</p>
        </div>
      </div>
    );
  }

  // --- Submitted screen ---
  if (submitted) {
    return (
      <div className="view player-view">
        <div className="status-card submitted">
          <h2>✅ Submitted!</h2>
          <p className="submit-order">
            You were <strong>#{submitOrder}</strong> to submit
          </p>
          {roundActive ? (
            <p className="waiting-text">Waiting for round to end...</p>
          ) : (
            <p className="waiting-text">Waiting for next round...</p>
          )}
        </div>
      </div>
    );
  }

  // --- Answer screen ---
  return (
    <div className="view player-view">
      <div className="round-card">
        <h2>Round {roundId}</h2>
        <form onSubmit={handleSubmit} className="answer-form">
          <textarea
            placeholder="Type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-large">
            🚀 Submit
          </button>
        </form>
      </div>
    </div>
  );
}
