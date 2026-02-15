import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import PlayerView from "./pages/PlayerView";
import AdminView from "./pages/AdminView";
import ScoreboardView from "./pages/ScoreboardView";

function Home() {
  return (
    <div className="home">
      <h1>🎮 Quiz Game</h1>
      <p>Choose your view:</p>
      <div className="home-links">
        <Link to="/play" className="btn btn-primary btn-large">
          🙋 Join as Player
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
      <Route path="/admin" element={<AdminView />} />
      <Route path="/scoreboard" element={<ScoreboardView />} />
    </Routes>
  );
}
