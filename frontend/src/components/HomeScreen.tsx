import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import audioService from '../services/EnhancedAudioService';
import { useGameStore } from '../store/GameContext';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { state } = useGameStore();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handlePlayClick = () => {
    audioService.playClick();
    audioService.resume();
    // Show tutorial for first-time players
    if (!state.tutorialCompleted && state.settings.showTutorial) {
      navigate('/tutorial');
    } else {
      navigate('/levels');
    }
  };

  const handleLeaderboardClick = () => {
    audioService.playClick();
    navigate('/leaderboard');
  };

  const features = [
    {
      id: 'mazes',
      icon: '🧭',
      title: 'Dynamic Mazes',
      description:
        'Every level is unique! Navigate through procedurally generated mazes that get progressively harder.',
      rules: [
        'Each maze is randomly generated',
        'Click anywhere to set a destination',
        'Your character finds the shortest path automatically',
        'Mazes get bigger and more complex as you level up',
      ],
    },
    {
      id: 'snacks',
      icon: '🍕',
      title: 'Collect Snacks',
      description:
        'Gather all the delicious snacks scattered throughout the maze to unlock the goal!',
      rules: [
        'Collect ALL food items before reaching the goal',
        'Different food emojis appear randomly',
        'Food collection is required to complete the level',
        'Watch out for ghosts that protect the snacks!',
      ],
    },
    {
      id: 'clock',
      icon: '⚡',
      title: 'Beat the Clock',
      description: 'Race against time to complete each level and climb the leaderboard!',
      rules: [
        'Your completion time is tracked',
        'Faster times = higher scores',
        'Submit your best times to the leaderboard',
        'Compete with players worldwide!',
      ],
    },
  ];

  return (
    <div className="home-screen">
      <div className="home-content fade-in">
        {/* Logo */}
        <div className="logo-container">
          <div className="logo-wrapper">
            <img src="/icon-512.png" alt="Tiger World Logo" className="game-logo pulse" />
          </div>
          <h1 className="game-title">TIGER WORLD</h1>
          <p className="game-subtitle">Navigate the Maze, Collect the Snacks!</p>
        </div>

        {/* CTA Buttons */}
        <div className="menu-buttons">
          <button className="btn btn-primary btn-play" onClick={handlePlayClick}>
            <span className="emoji">🎮</span> PLAY NOW
          </button>
          <button className="btn btn-secondary" onClick={handleLeaderboardClick}>
            <span className="emoji">🏆</span> Leaderboard
          </button>
        </div>

        {/* Quick Menu */}
        <div className="quick-menu">
          <button className="quick-menu-btn" onClick={() => navigate('/achievements')}>
            🏆 Achievements
          </button>
          <button className="quick-menu-btn" onClick={() => navigate('/settings')}>
            ⚙️ Settings
          </button>
        </div>

        {/* Daily Challenge */}
        {state.dailyChallenge && !state.dailyChallenge.completed && (
          <div
            className="daily-challenge-card"
            onClick={() => navigate(`/game/${state.dailyChallenge?.level}`)}
          >
            <span className="daily-icon">📅</span>
            <div className="daily-info">
              <h4>Daily Challenge</h4>
              <p>
                Level {state.dailyChallenge.level} - {state.dailyChallenge.type.replace('_', ' ')}
              </p>
            </div>
            <span className="daily-reward">+{state.dailyChallenge.reward} 🪙</span>
          </div>
        )}

        {/* Feature highlights */}
        <div className="features">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="feature-item"
              onClick={() => setActiveModal(feature.id)}
            >
              <span className="emoji feature-icon">{feature.icon}</span>
              <span>{feature.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Modal */}
      {activeModal && (
        <div className="game-modal" onClick={() => setActiveModal(null)}>
          <div className="modal-content card feature-modal" onClick={(e) => e.stopPropagation()}>
            {features
              .filter((f) => f.id === activeModal)
              .map((feature) => (
                <div key={feature.id}>
                  <div className="modal-header">
                    <span className="emoji modal-icon">{feature.icon}</span>
                    <h2>{feature.title}</h2>
                  </div>
                  <p className="modal-description">{feature.description}</p>
                  <div className="modal-rules">
                    <h3>How it Works:</h3>
                    <ul>
                      {feature.rules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="btn btn-primary" onClick={() => setActiveModal(null)}>
                    Got it! 👍
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Animated background particles */}
      <div className="bg-particles">
        {/* Floating tiger emojis */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`tiger-${i}`}
            className="particle emoji"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
              fontSize: `${1 + Math.random() * 1.5}rem`,
            }}
          >
            🐯
          </div>
        ))}
        {/* Food emojis */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`food-${i}`}
            className="particle emoji"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${6 + Math.random() * 10}s`,
            }}
          >
            {['🌮', '🍕', '🍔', '🍩', '🥨'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
