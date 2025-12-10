import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import audioService from '../services/EnhancedAudioService';
import { LEVEL_DEFINITIONS } from '../types/extended';
import './LevelCompleteModal.css';

interface LevelCompleteModalProps {
  level: number;
  score: number;
  time: number;
  foodsCollected: number;
  totalFoods: number;
  damageTaken: boolean;
  isGameComplete: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onHome: () => void;
}

const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  score,
  time,
  foodsCollected,
  totalFoods,
  damageTaken,
  isGameComplete,
  onNextLevel,
  onReplay,
  onHome,
}) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [starsRevealed, setStarsRevealed] = useState(0);

  // Calculate stars
  const getStars = () => {
    let stars = 1;
    if (!damageTaken) stars++;
    if (time < 60) stars++;
    return stars;
  };

  const stars = getStars();

  useEffect(() => {
    // Reveal stars one by one
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= stars; i++) {
      timers.push(
        setTimeout(() => {
          setStarsRevealed(i);
          audioService.playPowerUp();
        }, 300 + i * 400),
      );
    }

    // Start confetti
    setTimeout(() => setShowConfetti(true), 500);

    return () => timers.forEach(clearTimeout);
  }, [stars]);

  const totalLevels = LEVEL_DEFINITIONS.length;
  const hasNextLevel = level < totalLevels;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isGameComplete) {
    return (
      <div className="level-complete-overlay game-complete">
        {/* Big Confetti for game complete */}
        <div className="confetti-container">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={
                {
                  '--x': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 2}s`,
                  '--color': ['#FFD700', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0', '#FF69B4'][
                    Math.floor(Math.random() * 6)
                  ],
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="level-complete-modal game-complete-modal">
          <div className="trophy-container">
            <span className="big-trophy">🏆</span>
            <div className="trophy-sparkles">✨✨✨</div>
          </div>

          <h1 className="game-complete-title">🎉 CONGRATULATIONS, TIGER! 🎉</h1>
          <h2 className="game-complete-subtitle">You've Completed All Levels!</h2>

          <div className="game-complete-message">
            <p>🐯 You are the ULTIMATE Tiger Champion! 🐯</p>
            <p>All {totalLevels} levels conquered! You absolute legend! 💪</p>
          </div>

          <div className="final-stats">
            <div className="final-stat">
              <span className="stat-icon">🎯</span>
              <span className="stat-label">Final Score</span>
              <span className="stat-value">{score.toLocaleString()}</span>
            </div>
            <div className="final-stat">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Total Time</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
          </div>

          <div className="game-complete-actions">
            <button className="btn btn-primary celebration-btn" onClick={onReplay}>
              🔄 Play Again
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/levels')}>
              📋 View All Levels
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')}>
              🏆 Leaderboard
            </button>
            <button className="btn btn-secondary" onClick={onHome}>
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="level-complete-overlay">
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={
                {
                  '--x': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 2}s`,
                  '--color': ['#FFD700', '#FF6B35', '#4CAF50', '#2196F3', '#9C27B0'][
                    Math.floor(Math.random() * 5)
                  ],
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="level-complete-modal">
        <div className="level-badge">Level {level}</div>

        <h1 className="complete-title">
          <span className="emoji-bounce">🎉</span>
          Level Complete!
          <span className="emoji-bounce">🎉</span>
        </h1>

        <p className="tiger-message">Well done, Tiger! 🐯</p>

        {/* Stars */}
        <div className="stars-container">
          {[1, 2, 3].map((starNum) => (
            <span key={starNum} className={`star ${starsRevealed >= starNum ? 'earned' : 'empty'}`}>
              {starsRevealed >= starNum ? '⭐' : '☆'}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="complete-stats">
          <div className="complete-stat">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Score</span>
            <span className="stat-value">{score.toLocaleString()}</span>
          </div>
          <div className="complete-stat">
            <span className="stat-icon">⏱️</span>
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(time)}</span>
          </div>
          <div className="complete-stat">
            <span className="stat-icon">🍕</span>
            <span className="stat-label">Foods</span>
            <span className="stat-value">
              {foodsCollected}/{totalFoods}
            </span>
          </div>
        </div>

        {/* Bonuses */}
        <div className="bonuses">
          {!damageTaken && <div className="bonus-badge perfect">⭐ Perfect Run - No Damage!</div>}
          {time < 30 && <div className="bonus-badge speed">⚡ Speed Demon - Under 30s!</div>}
        </div>

        {/* Actions */}
        <div className="complete-actions">
          {hasNextLevel ? (
            <button className="btn btn-primary next-level-btn" onClick={onNextLevel}>
              Let's Go, Tiger! ➡️
              <span className="next-level-preview">Level {level + 1}</span>
            </button>
          ) : (
            <button className="btn btn-primary celebration-btn" onClick={onHome}>
              🏠 Back to Home
            </button>
          )}
          <div className="secondary-actions">
            <button className="btn btn-secondary" onClick={onReplay}>
              🔄 Replay
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/levels')}>
              📋 Levels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelCompleteModal;
