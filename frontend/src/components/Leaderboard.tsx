import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import audioService from '../services/EnhancedAudioService';
import scoreService, { Score } from '../services/scoreService';
import './Leaderboard.css';

type LeaderboardTab = 'global' | 'friends' | 'weekly';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const data = await scoreService.getLeaderboard();
        setScores(data);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const filteredScores = scores.filter(score => 
    selectedLevel === 'all' || score.level === selectedLevel
  );

  const handleTabChange = (tab: LeaderboardTab) => {
    audioService.playClick();
    setActiveTab(tab);
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-container card">
        <div className="leaderboard-header">
          <h1><span className="emoji">🏆</span> Hall of Fame <span className="emoji">🏆</span></h1>
          <button 
            className="btn btn-secondary back-btn" 
            onClick={() => navigate('/')}
          >
            <span className="emoji">🏠</span> Home
          </button>
        </div>

        {/* Tabs */}
        <div className="leaderboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => handleTabChange('global')}
          >
            🌍 Global
          </button>
          <button 
            className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => handleTabChange('weekly')}
          >
            📅 Weekly
          </button>
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => handleTabChange('friends')}
          >
            👥 Friends
          </button>
        </div>

        {/* Level Filter */}
        <div className="level-filter">
          <label htmlFor="level-filter-select" className="sr-only">Filter by Level</label>
          <select 
            id="level-filter-select"
            title="Filter by Level"
            value={selectedLevel} 
            onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="level-select"
          >
            <option value="all">All Levels</option>
            {[1,2,3,4,5,6,7,8,9,10].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div className="loading"></div>
        ) : (
          <div className="scores-list">
            <div className="score-header">
              <span>Rank</span>
              <span>Player</span>
              <span>Level</span>
              <span>Score</span>
            </div>
            {filteredScores.length === 0 ? (
              <p className="no-scores">No scores yet. Be the first!</p>
            ) : (
              filteredScores.map((score, index) => (
                <div key={score.id} className={`score-row ${index < 3 ? 'top-rank rank-' + (index + 1) : ''}`}>
                  <span className="rank">{getRankEmoji(index)}</span>
                  <span className="player-name">
                    <span className="player-avatar">🐯</span>
                    {score.player_name}
                  </span>
                  <span className="level">Lvl {score.level}</span>
                  <span className="score-value">{score.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Player's Best */}
        <div className="your-best">
          <h3>📊 Your Best Scores</h3>
          <p className="coming-soon">Sign in to track your personal records!</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
