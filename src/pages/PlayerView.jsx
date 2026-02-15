import React, { useState, useEffect, useRef } from "react";
import socket from "../socket";

export default function PlayerView() {
  const [joined, setJoined] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");

  const [roundActive, setRoundActive] = useState(false);
  const [roundId, setRoundId] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitOrder, setSubmitOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const timerRef = useRef(null);
  const prevScoreRef = useRef(null); // null = not yet initialized
  const teamNameRef = useRef("");

  // Keep teamNameRef in sync to avoid stale closures in socket handlers
  useEffect(() => {
    teamNameRef.current = teamName;
  }, [teamName]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (duration) => {
    clearTimer();
    if (!duration) return;
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    socket.on("round-started", ({ roundId, duration }) => {
      setRoundId(roundId);
      setRoundActive(true);
      setSubmitted(false);
      setSubmitOrder(null);
      setAnswer("");
      startTimer(duration);
      setSubmissionHistory((prev) => [...prev, { roundId, answer: null, points: 0 }]);
    });

    socket.on("round-ended", () => {
      setRoundActive(false);
      clearTimer();
      setTimeLeft(null);
    });

    socket.on("scores-updated", (scores) => {
      const myName = teamNameRef.current;
      if (!myName) return;
      const myScore = scores.find((s) => s.name === myName)?.score ?? 0;
      if (prevScoreRef.current === null) {
        prevScoreRef.current = myScore;
        return;
      }
      const delta = myScore - prevScoreRef.current;
      prevScoreRef.current = myScore;
      if (delta > 0) {
        setSubmissionHistory((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = { ...updated[lastIdx], points: updated[lastIdx].points + delta };
          return updated;
        });
      }
    });

    socket.on("game-reset", () => {
      setJoined(false);
      setRoundActive(false);
      setSubmitted(false);
      setAnswer("");
      setTeamName("");
      setSubmissionHistory([]);
      setShowHistory(false);
      prevScoreRef.current = null;
      clearTimer();
      setTimeLeft(null);
    });

    return () => {
      socket.off("round-started");
      socket.off("round-ended");
      socket.off("scores-updated");
      socket.off("game-reset");
      clearTimer();
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    setError("");
    socket.emit("join-team", { teamName }, (res) => {
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
    const submittedAnswer = answer.trim();
    socket.emit("submit-answer", { answer: submittedAnswer }, (res) => {
      if (res?.success) {
        setSubmitted(true);
        setSubmitOrder(res.order);
        setSubmissionHistory((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = { ...updated[lastIdx], answer: submittedAnswer };
          return updated;
        });
      }
    });
  };

  const historyPanel = showHistory && submissionHistory.length > 0 && (
    <div className="history-panel">
      <h3>📋 Your History</h3>
      {submissionHistory.map((entry, i) => (
        <div key={i} className="history-entry">
          <span className="history-round">Round {entry.roundId}</span>
          <p className="history-answer">{entry.answer ?? <em>No answer submitted</em>}</p>
          <span className={`history-points ${entry.points > 0 ? "history-points-earned" : ""}`}>
            {entry.points > 0 ? `+${entry.points} pts` : "0 pts"}
          </span>
        </div>
      ))}
    </div>
  );

  // --- Join screen ---
  if (!joined) {
    return (
      <div className="view player-view">
        <h1>🙋 Create a Team</h1>
        <form onSubmit={handleJoin} className="join-form">
          <input
            type="text"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            autoFocus
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
          <h2>Team {teamName}</h2>
          <div className="waiting-animation">
            <div className="pulse-dot"></div>
          </div>
          <p className="waiting-text">Waiting for the next round...</p>
          {submissionHistory.length > 0 && (
            <button
              className="btn btn-ghost btn-sm history-btn"
              onClick={() => setShowHistory((v) => !v)}
            >
              📋 {showHistory ? "Hide" : "Show"} History
            </button>
          )}
        </div>
        {historyPanel}
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
          {submissionHistory.length > 0 && (
            <button
              className="btn btn-ghost btn-sm history-btn"
              onClick={() => setShowHistory((v) => !v)}
            >
              📋 {showHistory ? "Hide" : "Show"} History
            </button>
          )}
        </div>
        {historyPanel}
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
          {timeLeft !== null && (
            <p className={`timer ${timeLeft <= 10 ? "timer-urgent" : timeLeft <= 30 ? "timer-warning" : ""}`}>
              ⏱ {timeLeft}s remaining
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-large">
            🚀 Submit
          </button>
        </form>
      </div>
    </div>
  );
}
