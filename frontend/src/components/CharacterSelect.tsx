import { useNavigate } from 'react-router-dom';
import audioService from '../services/EnhancedAudioService';
import { useGameStore } from '../store/GameContext';
import './CharacterSelect.css';

const CharacterSelect = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGameStore();

  const handleSelectSkin = (skinId: string) => {
    const skin = state.skins.find((s) => s.id === skinId);
    if (skin?.unlocked) {
      audioService.playClick();
      dispatch({ type: 'SET_SKIN', payload: skinId });
    }
  };

  return (
    <div className="character-screen">
      <div className="character-container card">
        <h1>🎨 Character Select</h1>

        <div className="current-character">
          <div className="character-preview">
            <span className="character-emoji">
              {state.skins.find((s) => s.id === state.selectedSkin)?.emoji || '🐯'}
            </span>
            {state.skins.find((s) => s.id === state.selectedSkin)?.trailColor && (
              <div
                className="trail-preview"
                style={{
                  background:
                    state.skins.find((s) => s.id === state.selectedSkin)?.trailColor === 'rainbow'
                      ? 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)'
                      : state.skins.find((s) => s.id === state.selectedSkin)?.trailColor,
                }}
              />
            )}
          </div>
          <h2>{state.skins.find((s) => s.id === state.selectedSkin)?.name}</h2>
        </div>

        <div className="skins-grid">
          {state.skins.map((skin) => (
            <div
              key={skin.id}
              className={`skin-card ${skin.unlocked ? 'unlocked' : 'locked'} ${
                state.selectedSkin === skin.id ? 'selected' : ''
              }`}
              onClick={() => handleSelectSkin(skin.id)}
            >
              <div className="skin-icon">{skin.unlocked ? skin.emoji : '🔒'}</div>
              <div className="skin-info">
                <h3>{skin.name}</h3>
                <p>
                  {skin.unlocked
                    ? skin.trailColor
                      ? `Trail: ${skin.trailColor}`
                      : 'Classic style'
                    : skin.unlockCondition}
                </p>
              </div>
              {state.selectedSkin === skin.id && <div className="selected-badge">✓</div>}
            </div>
          ))}
        </div>

        <div className="coins-display">
          <span className="coin-icon">🪙</span>
          <span className="coin-count">{state.coins}</span>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/')}>
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default CharacterSelect;
