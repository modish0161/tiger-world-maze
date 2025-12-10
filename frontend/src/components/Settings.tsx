import { useNavigate } from 'react-router-dom';
import audioService from '../services/EnhancedAudioService';
import { useGameStore } from '../store/GameContext';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGameStore();

  const handleToggle = (setting: keyof typeof state.settings) => {
    audioService.playClick();
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { [setting]: !state.settings[setting] },
    });

    // Apply immediate effects
    if (setting === 'soundEnabled') {
      audioService.toggleMute();
    }
    if (setting === 'musicEnabled') {
      audioService.toggleMusic();
    }
    if (setting === 'fullscreen') {
      if (!state.settings.fullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
      localStorage.removeItem('tiger-world-game-store');
      window.location.reload();
    }
  };

  const settingsList = [
    {
      key: 'soundEnabled' as const,
      label: 'Sound Effects',
      icon: state.settings.soundEnabled ? '🔊' : '🔇',
      description: 'Toggle game sound effects',
    },
    {
      key: 'musicEnabled' as const,
      label: 'Music',
      icon: state.settings.musicEnabled ? '🎵' : '🎵',
      description: 'Toggle background music',
    },
    {
      key: 'hapticEnabled' as const,
      label: 'Haptic Feedback',
      icon: '📳',
      description: 'Vibration on mobile devices',
    },
    {
      key: 'showMinimap' as const,
      label: 'Show Minimap',
      icon: '🗺️',
      description: 'Display ghost locations',
    },
    {
      key: 'showTutorial' as const,
      label: 'Show Tutorials',
      icon: '📖',
      description: 'Display helpful tips',
    },
    {
      key: 'fullscreen' as const,
      label: 'Fullscreen',
      icon: '🖥️',
      description: 'Toggle fullscreen mode',
    },
  ];

  return (
    <div className="settings-screen">
      <div className="settings-container card">
        <h1>⚙️ Settings</h1>

        <div className="settings-list">
          {settingsList.map((setting) => (
            <div key={setting.key} className="setting-item">
              <div className="setting-info">
                <span className="setting-icon">{setting.icon}</span>
                <div className="setting-text">
                  <span className="setting-label">{setting.label}</span>
                  <span className="setting-description">{setting.description}</span>
                </div>
              </div>
              <button
                className={`toggle-btn ${state.settings[setting.key] ? 'active' : ''}`}
                onClick={() => handleToggle(setting.key)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
          ))}
        </div>

        <div className="settings-section">
          <h3>📊 Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{state.progress.totalGamesPlayed}</span>
              <span className="stat-label">Games Played</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{state.progress.highestLevel}</span>
              <span className="stat-label">Highest Level</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{state.progress.totalScore.toLocaleString()}</span>
              <span className="stat-label">Total Score</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{state.progress.totalFoodsCollected}</span>
              <span className="stat-label">Foods Collected</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{state.progress.perfectRuns}</span>
              <span className="stat-label">Perfect Runs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.floor(state.progress.totalTimePlayedMs / 60000)}m
              </span>
              <span className="stat-label">Time Played</span>
            </div>
          </div>
        </div>

        <div className="settings-section danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <button className="btn btn-danger" onClick={handleResetProgress}>
            🗑️ Reset All Progress
          </button>
        </div>

        <div className="settings-section">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <div className="shortcuts-list">
            <div className="shortcut-item">
              <kbd>W/↑</kbd>
              <span>Move Up</span>
            </div>
            <div className="shortcut-item">
              <kbd>S/↓</kbd>
              <span>Move Down</span>
            </div>
            <div className="shortcut-item">
              <kbd>A/←</kbd>
              <span>Move Left</span>
            </div>
            <div className="shortcut-item">
              <kbd>D/→</kbd>
              <span>Move Right</span>
            </div>
            <div className="shortcut-item">
              <kbd>ESC</kbd>
              <span>Pause Game</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>📄 Legal</h3>
          <div className="legal-links">
            <button className="btn btn-secondary" onClick={() => navigate('/privacy')}>
              🔒 Privacy Policy
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/terms')}>
              📜 Terms of Service
            </button>
          </div>
          <p className="legal-footer">© 2024 Indigo Pascal Ltd</p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/')}>
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default Settings;
