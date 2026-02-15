import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import PlayerView from "./pages/PlayerView";
import AdminView from "./pages/AdminView";
import ScoreboardView from "./pages/ScoreboardView";

function PasswordGate({ children }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === "wiztec12") {
      setUnlocked(true);
    } else {
      setError("Incorrect password");
      setInput("");
    }
  };

  return (
    <div className="view player-view">
      <h1>🔒 Password Required</h1>
      <form onSubmit={handleSubmit} className="join-form">
        <input
          type="password"
          placeholder="Enter password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Enter
        </button>
      </form>
    </div>
  );
}

function Home() {
  return (
    <div className="home">
      <h1>🎮 Quiz Game</h1>
      <p>Choose your view:</p>
      <div className="home-links">
        <Link to="/play" className="btn btn-primary btn-large">
          🙋 Create a Team
        </Link>
        <Link to="/admin" className="btn btn-secondary btn-large">
          👑 Admin Panel
        </Link>
        <Link to="/scoreboard" className="btn btn-accent btn-large">
          📊 Scoreboard
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<PlayerView />} />
      <Route path="/admin" element={<PasswordGate><AdminView /></PasswordGate>} />
      <Route path="/scoreboard" element={<PasswordGate><ScoreboardView /></PasswordGate>} />
    </Routes>
  );
}
